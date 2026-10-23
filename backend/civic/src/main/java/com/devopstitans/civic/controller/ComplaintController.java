package com.devopstitans.civic.controller;

import com.devopstitans.civic.model.Complaint;
import com.devopstitans.civic.repository.ComplaintRepository;
import com.devopstitans.civic.service.FileStorageService;
import com.devopstitans.civic.service.ImageAnalysisService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
@CrossOrigin(origins = "*") 
public class ComplaintController {

    @Autowired
    private ComplaintRepository repository;

    @Autowired
    private ImageAnalysisService aiService;

    @Autowired
    private FileStorageService fileStorageService;

    // 1. ADMIN DASHBOARD FETCH (FILTERED BY DEPARTMENT AND/OR LOCALITY)
    @GetMapping("/all")
    public List<Complaint> getAllComplaints(
        @RequestParam(required = false) String department, 
        @RequestParam(required = false) String city) {
        
        boolean hasDept = department != null && !department.trim().isEmpty() && !department.equalsIgnoreCase("All");
        boolean hasCity = city != null && !city.trim().isEmpty() && !city.equalsIgnoreCase("All");

        if (hasDept && hasCity) {
            System.out.println("Admin Filter Active: Dept=" + department + ", Locality=" + city);
            return repository.findByDepartmentIgnoreCaseAndLocationContainingIgnoreCase(department.trim(), city.trim());
        } else if (hasDept) {
            System.out.println("Admin Filter Active: Dept=" + department);
            return repository.findByDepartmentIgnoreCase(department.trim());
        } else if (hasCity) {
            System.out.println("Admin Filter Active: Locality=" + city);
            return repository.findByLocationContainingIgnoreCase(city.trim());
        }

        return repository.findAll();
    }

    // 2. AI SUGGEST ENDPOINT (For the "✨ Suggest Description" button)
    @PostMapping("/describe")
    public ResponseEntity<String> getAIDescription(@RequestParam("image") MultipartFile image) {
        try {
            String aiResult = aiService.analyzeImage(image.getBytes()); 
            
            if (aiResult.contains("PRIVACY_ERROR")) {
                return ResponseEntity.badRequest().body("REJECTED: Person detected. Use a different photo.");
            }
            
            if (aiResult.contains("VALID")) {
                String[] parts = aiResult.split("\\|");
                String desc = parts.length > 1 ? parts[1].trim() : "Civic issue detected.";
                if (desc.contains("AI offline mode")) {
                    desc = "Pothole / road damage detected on the roadway requiring municipal repair.";
                }
                return ResponseEntity.ok(desc);
            }
            
            return ResponseEntity.badRequest().body("AI could not detect a valid civic issue in this photo. Please ensure the issue is clearly visible.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error analyzing photo: " + e.getMessage());
        }
    }

    // 3. MAIN SUBMISSION (WITH AWS S3/LOCAL STORAGE, PRIVACY & VALIDITY GATE)
    @PostMapping("/submit")
    public ResponseEntity<String> submitComplaint(
            @RequestParam("email") String email,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("department") String department,
            @RequestParam("location") String location,
            @RequestParam("image") MultipartFile image) {
        
        String storedFileUrl = null;
        try {
            // Store file using FileStorageService (AWS S3 with automatic local disk fallback)
            storedFileUrl = fileStorageService.storeFile(image);

            // Analyze with AI (Gemini Vision)
            byte[] imageBytes = image.getBytes();
            String aiResult = aiService.analyzeImage(imageBytes); 
            System.out.println("AI Image Verification Result: " + aiResult);

            // Check for Humans (Citizen Privacy Gate)
            if (aiResult.contains("PRIVACY_ERROR")) {
                fileStorageService.deleteFile(storedFileUrl);
                return ResponseEntity.badRequest().body("REJECTED: Human face detected in photo. Please protect citizen privacy by uploading only the civic issue.");
            } 
            
            // Check for Validity Gate
            if (aiResult.contains("NOT_CIVIC_ISSUE")) {
                fileStorageService.deleteFile(storedFileUrl);
                return ResponseEntity.badRequest().body("REJECTED: No civic issue detected. Please upload a clear photo of the pothole, garbage, or damage.");
            }

            if (aiResult.contains("VALID")) {
                String[] parts = aiResult.split("\\|");
                String aiDescription = (parts.length > 1) ? parts[1].trim() : "Civic issue reported.";
                if (aiDescription.contains("AI offline mode")) {
                    aiDescription = "Civic issue reported by citizen.";
                }

                Complaint complaint = new Complaint();
                complaint.setEmail(email);
                
                if (description == null || description.trim().isEmpty() || description.equals("undefined")) {
                    complaint.setDescription(aiDescription);
                } else {
                    complaint.setDescription(description.trim());
                }

                complaint.setDepartment(department);
                complaint.setLocation(location);
                complaint.setImageUrl(storedFileUrl); 
                complaint.setStatus("NOT_REVIEWED");

                repository.save(complaint);
                return ResponseEntity.ok("Success! Issue registered and submitted to the municipal authority.");
            }

            fileStorageService.deleteFile(storedFileUrl);
            return ResponseEntity.badRequest().body("AI could not verify the photo. Please try uploading a clearer image.");

        } catch (Exception e) {
            System.err.println("Submission error: " + e.getMessage());
            if (storedFileUrl != null) {
                fileStorageService.deleteFile(storedFileUrl);
            }
            return ResponseEntity.internalServerError().body("Submission failed: " + e.getMessage());
        }
    }

    // 4. STATUS UPDATE
    @PutMapping("/{id}/status")
    public ResponseEntity<String> updateStatus(
            @PathVariable Long id, 
            @RequestParam("status") String newStatus) {
        
        return repository.findById(id).map(complaint -> {
            complaint.setStatus(newStatus);
            repository.save(complaint);
            return ResponseEntity.ok("Status updated to " + newStatus);
        }).orElse(ResponseEntity.notFound().build());
    }
}