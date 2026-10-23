package com.devopstitans.civic.service;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import java.util.*;

@Service
public class ImageAnalysisService {

    @Value("${gemini.api-key:}")
    private String apiKey; 

    public String analyzeImage(byte[] imageBytes) {
        if (apiKey == null || apiKey.trim().isEmpty() || apiKey.trim().startsWith("your-") || apiKey.trim().equalsIgnoreCase("YOUR_GEMINI_API_KEY")) {
            System.err.println("Warning: GEMINI_API_KEY is not configured or placeholder. Allowing submission in fallback mode.");
            return "VALID | Civic issue reported (AI offline mode - Gemini API key not configured).";
        }

        String prompt = "Act as a civic authority inspector. Analyze this image carefully: " +
                        "1. If a human face is clearly visible in the foreground, reply ONLY with: PRIVACY_ERROR. " +
                        "2. If no humans and a genuine civic issue exists (e.g. pothole, damaged road, overflowing garbage, broken streetlight, open drain, water leakage), reply with: VALID | [concise 1-sentence description of the issue]. " +
                        "3. Otherwise, reply with: NOT_CIVIC_ISSUE.";

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // Standard Gemini REST API specification requires camelCase: inlineData and mimeType
        Map<String, Object> inlineData = Map.of(
            "mimeType", "image/jpeg",
            "data", base64Image
        );
        Map<String, Object> part1 = Map.of("text", prompt);
        Map<String, Object> part2 = Map.of("inlineData", inlineData);
        Map<String, Object> contents = Map.of("parts", List.of(part1, part2));
        Map<String, Object> body = Map.of("contents", List.of(contents));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();

        // Try supported Gemini model endpoints
        List<String> models = List.of("gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-flash");
        for (String model : models) {
            try {
                String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey.trim();
                ResponseEntity<Map> response = restTemplate.exchange(geminiUrl, HttpMethod.POST, entity, Map.class);
                String result = extractText(response.getBody());
                if (result != null && !result.equals("ERROR_PARSING")) {
                    return result.trim();
                }
            } catch (Exception e) {
                System.err.println("Gemini model (" + model + ") attempt error: " + e.getMessage());
            }
        }

        // If all API calls fail (e.g. quota, bad key, or network issue), fallback gracefully
        return "VALID | Civic issue reported (AI offline mode).";
    }

    private String extractText(Map responseBody) {
        try {
            List candidates = (List) responseBody.get("candidates");
            Map candidate = (Map) candidates.get(0);
            Map content = (Map) candidate.get("content");
            List parts = (List) content.get("parts");
            return (String) ((Map) parts.get(0)).get("text");
        } catch (Exception e) {
            System.err.println("Parse Error: " + e.getMessage());
            return "ERROR_PARSING";
        }
    }
}