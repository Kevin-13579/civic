package com.devopstitans.civic.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3ClientBuilder;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${aws.s3.bucket-name:}")
    private String s3BucketName;

    @Value("${aws.s3.region:ap-south-1}")
    private String s3Region;

    @Value("${aws.s3.access-key:}")
    private String awsAccessKey;

    @Value("${aws.s3.secret-key:}")
    private String awsSecretKey;

    @Value("${file.upload-dir:./uploads/}")
    private String localUploadDir;

    private S3Client s3Client;
    private boolean isS3Enabled = false;

    @PostConstruct
    public void init() {
        if (s3BucketName != null && !s3BucketName.trim().isEmpty()) {
            try {
                S3ClientBuilder builder = S3Client.builder().region(Region.of(s3Region));
                if (awsAccessKey != null && !awsAccessKey.trim().isEmpty() &&
                    awsSecretKey != null && !awsSecretKey.trim().isEmpty()) {
                    builder.credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(awsAccessKey.trim(), awsSecretKey.trim())
                    ));
                } else {
                    // Automatically uses AWS IAM Role on EC2, ECS, or Elastic Beanstalk
                    builder.credentialsProvider(DefaultCredentialsProvider.create());
                }
                this.s3Client = builder.build();
                this.isS3Enabled = true;
                System.out.println("AWS S3 Storage initialized successfully for bucket: " + s3BucketName);
            } catch (Exception e) {
                System.err.println("Could not initialize AWS S3 client, falling back to local file storage: " + e.getMessage());
                this.isS3Enabled = false;
            }
        } else {
            System.out.println("No AWS S3 bucket specified. Using local disk file storage at: " + localUploadDir);
        }

        // Ensure local upload folder exists
        try {
            File dir = new File(localUploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }
        } catch (Exception e) {
            System.err.println("Error initializing upload directory: " + e.getMessage());
        }
    }

    /**
     * Stores a file in Amazon S3 if configured, otherwise stores in local disk directory.
     * @return The accessible file URL (S3 public URL or local file path)
     */
    public String storeFile(MultipartFile file) throws IOException {
        String cleanOriginalName = file.getOriginalFilename() != null 
                ? file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_") 
                : "upload.jpg";
        String uniqueFileName = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "_" + cleanOriginalName;

        if (isS3Enabled && s3Client != null) {
            String s3Key = "uploads/" + uniqueFileName;
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(s3BucketName)
                    .key(s3Key)
                    .contentType(file.getContentType() != null ? file.getContentType() : "image/jpeg")
                    .build();

            s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

            // Return public S3 URL
            return String.format("https://%s.s3.%s.amazonaws.com/%s", s3BucketName, s3Region, s3Key);
        } else {
            // Local file storage
            Path targetDir = Paths.get(localUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }
            Path targetPath = targetDir.resolve(uniqueFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return targetPath.toString();
        }
    }

    /**
     * Safely deletes an image if validation (e.g. Gemini AI civic verification) fails.
     */
    public void deleteFile(String fileUrlOrPath) {
        if (fileUrlOrPath == null || fileUrlOrPath.trim().isEmpty()) return;

        try {
            if (isS3Enabled && s3Client != null && fileUrlOrPath.contains("s3.") && fileUrlOrPath.contains(s3BucketName)) {
                String prefix = String.format("https://%s.s3.%s.amazonaws.com/", s3BucketName, s3Region);
                String key = fileUrlOrPath.replace(prefix, "");
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(s3BucketName).key(key).build());
            } else {
                Path path = Paths.get(fileUrlOrPath);
                Files.deleteIfExists(path);
            }
        } catch (Exception e) {
            System.err.println("Failed to clean up rejected file: " + e.getMessage());
        }
    }

    public boolean isS3Enabled() {
        return isS3Enabled;
    }
}
