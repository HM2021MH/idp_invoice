package org.um5.ensias.backendnew.Services;

import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;

@Service
public class OllamaService {

    private final WebClient webClient = WebClient.builder()
            .baseUrl("http://localhost:11434")
            .build();

    // Map of available models with their Ollama identifiers
    private static final Map<String, String> MODEL_MAP = Map.of(
            "phi3:mini", "phi3:mini",
            "llama3.2:1b", "llama3.2:1b",
            "qwen2.5:0.5b", "qwen2.5:0.5b"

    );

    /**
     * Run inference with specified model
     * @param prompt The prompt to send to the model
     * @param modelKey The model key (phi3, llama, mistral, gemma)
     * @return The model's response
     */
    public String runModel(String prompt, String modelKey) {
        String modelName = MODEL_MAP.getOrDefault(modelKey, "phi3:mini");

        Map<String, Object> body = Map.of(
                "model", modelName,
                "prompt", prompt,
                "stream", false
        );

        try {
            return webClient.post()
                    .uri("/api/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(res -> res.get("response").toString())
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Failed to get response from model: " + modelName, e);
        }
    }

    /**
     * Legacy method for backward compatibility
     */
    public String runPhi3(String prompt) {
        return runModel(prompt, "phi3");
    }

    /**
     * Check if a model is available in Ollama
     * @param modelKey The model key to check
     * @return true if the model is available
     */
    public boolean isModelAvailable(String modelKey) {
        return MODEL_MAP.containsKey(modelKey);
    }

    /**
     * Get all available model keys
     * @return Array of available model keys
     */
    public String[] getAvailableModels() {
        return MODEL_MAP.keySet().toArray(new String[0]);
    }

    /**
     * Get the actual Ollama model name for a given key
     * @param modelKey The model key
     * @return The Ollama model name
     */
    public String getModelName(String modelKey) {
        return MODEL_MAP.getOrDefault(modelKey, "phi3:mini");
    }
}