package org.um5.ensias.backendnew.Services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

@Service
public class ResponseCleanerService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public String cleanJsonResponse(String llmResponse) {
        if (llmResponse == null || llmResponse.isEmpty()) {
            return llmResponse;
        }

        // Remove markdown code blocks
        String cleaned = llmResponse.trim();
        cleaned = cleaned.replaceAll("^```json\\s*", "");
        cleaned = cleaned.replaceAll("^```\\s*", "");
        cleaned = cleaned.replaceAll("\\s*```$", "");
        cleaned = cleaned.trim();

        // Validate and prettify JSON
        try {
            JsonNode jsonNode = objectMapper.readTree(cleaned);
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonNode);
        } catch (Exception e) {
            // If not valid JSON, return cleaned version
            return cleaned;
        }
    }

    public JsonNode parseToJson(String llmResponse) {
        try {
            String cleaned = cleanJsonResponse(llmResponse);
            return objectMapper.readTree(cleaned);
        } catch (Exception e) {
            return null;
        }
    }
}