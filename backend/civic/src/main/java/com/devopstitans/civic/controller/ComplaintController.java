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
                return ResponseEntity.ok(parts.length > 1 ? parts[1].trim() : "Civic issue detected.");
            }
            
            return ResponseEntity.badRequest().body("AI says this isn't a civic issue.");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
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
            // Store file using FileStorageService (AWS S3 or Local fallback)
            storedFileUrl = fileStorageService.storeFile(image);

            // Analyze with AI
            byte[] imageBytes = image.getBytes();
            String aiResult = aiService.analyzeImage(imageBytes); 
            System.out.println("DEBUG: AI Result is -> " + aiResult);

            // Check for Humans (Privacy)
            if (aiResult.contains("PRIVACY_ERROR")) {
                fileStorageService.deleteFile(storedFileUrl);
                return ResponseEntity.badRequest().body("REJECTED: Person detected in image. Please protect privacy.");
            } 
            
            // Check for Validity
            if (aiResult.contains("NOT_CIVIC_ISSUE")) {
                fileStorageService.deleteFile(storedFileUrl);
                return ResponseEntity.badRequest().body("REJECTED: No civic issue detected in this photo.");
            }

            if (aiResult.contains("VALID")) {
                String[] parts = aiResult.split("\\|");
                String aiDescription = (parts.length > 1) ? parts[1].trim() : "Report filed via AI verification.";

                Complaint complaint = new Complaint();
                complaint.setEmail(email);
                
                if (description == null || description.trim().isEmpty() || description.equals("undefined")) {
                    complaint.setDescription(aiDescription);
                } else {
                    complaint.setDescription(description);
                }

                complaint.setDepartment(department);
                complaint.setLocation(location);
                complaint.setImageUrl(storedFileUrl); 
                complaint.setStatus("NOT_REVIEWED");

                repository.save(complaint);
                return ResponseEntity.ok("Success! AI verified and issue registered.");
            }

            fileStorageService.deleteFile(storedFileUrl);
            return ResponseEntity.badRequest().body("AI could not verify the photo. Please try again.");

        } catch (Exception e) {
            if (storedFileUrl != null) {
                fileStorageService.deleteFile(storedFileUrl);
            }
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
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