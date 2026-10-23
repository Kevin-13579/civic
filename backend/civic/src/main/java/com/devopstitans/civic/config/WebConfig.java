package com.devopstitans.civic.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload-dir:./uploads/}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            String pathUri = uploadPath.toUri().toString();
            if (!pathUri.endsWith("/")) {
                pathUri += "/";
            }
            // Maps "/uploads/**" to the dynamically configured upload directory
            registry.addResourceHandler("/uploads/**")
                    .addResourceLocations(pathUri);
        } catch (Exception e) {
            System.err.println("Could not configure static uploads resource handler: " + e.getMessage());
        }
    }
}