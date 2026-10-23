package com.devopstitans.civic.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.*;

@Service
public class GeminiService {

    // 1. Injects the key from application.properties
    @Value("${gemini.api-key:}")
    private String apiKey;

    public String analyzeImage(byte[] imageBytes) {
        RestTemplate restTemplate = new RestTemplate();
        
        // 2. Build the URL dynamically using the injected key
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
        
        // 3. The most stable prompt format
        String prompt = "Analyze this image for a civic report. " +
                        "If you see any human faces/people, reply ONLY with: PRIVACY_ERROR. " +
                        "If no humans, and it is a civic issue (like trash, pothole, or damage), reply with: VALID | followed by a 1-sentence description. " +
                        "Otherwise, reply: NOT_CIVIC_ISSUE.";

        // 4. Convert image bytes to Base64
        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        // 5. Construct the JSON Request Body
        Map<String, Object> inlineData = Map.of(
            "mime_type", "image/jpeg",
            "data", base64Image
        );

        Map<String, Object> part1 = Map.of("text", prompt);
        Map<String, Object> part2 = Map.of("inline_data", inlineData);

        Map<String, Object> contents = Map.of("parts", List.of(part1, part2));
        Map<String, Object> body = Map.of("contents", List.of(contents));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            // Use the locally built geminiUrl
            ResponseEntity<Map> response = restTemplate.postForEntity(geminiUrl, entity, Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            System.err.println("Gemini Error: " + e.getMessage());
            return "ERROR | AI_TIMEOUT";
        }
    }

    private String extractText(Map responseBody) {
        try {
            List candidates = (List) responseBody.get("candidates");
            Map firstCandidate = (Map) candidates.get(0);
            Map content = (Map) firstCandidate.get("content");
            List parts = (List) content.get("parts");
            Map firstPart = (Map) parts.get(0);
            return (String) firstPart.get("text");
        } catch (Exception e) {
            return "ERROR | PARSING_FAILED";
        }
    }
}