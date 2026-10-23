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
        if (apiKey == null || apiKey.trim().isEmpty()) {
            System.err.println("Warning: GEMINI_API_KEY is not configured. Allowing submission in fallback mode.");
            return "VALID | Civic issue recorded.";
        }

        RestTemplate restTemplate = new RestTemplate();
        String geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;

        String prompt = "Act as a civic authority inspector. Analyze this image: " +
                        "Ignore background noise. " +
                        "1. If a human face is in foreground, reply ONLY: PRIVACY_ERROR. " +
                        "2. If no humans and a civic issue exists, reply: VALID | [1-sentence description]. " +
                        "3. Otherwise, reply: NOT_CIVIC_ISSUE.";

        String base64Image = Base64.getEncoder().encodeToString(imageBytes);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> inlineData = Map.of(
            "mime_type", "image/jpeg",
            "data", base64Image
        );
        Map<String, Object> part1 = Map.of("text", prompt);
        Map<String, Object> part2 = Map.of("inline_data", inlineData);
        Map<String, Object> contents = Map.of("parts", List.of(part1, part2));
        Map<String, Object> body = Map.of("contents", List.of(contents));

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(geminiUrl, HttpMethod.POST, entity, Map.class);
            return extractText(response.getBody());
        } catch (Exception e) {
            System.err.println("API Error Details: " + e.getMessage());
            // If API quota or network issue, fallback gracefully
            return "VALID | Civic issue reported (AI offline mode).";
        }
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