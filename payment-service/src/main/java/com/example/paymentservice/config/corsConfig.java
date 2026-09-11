package com.example.paymentservice.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration 
public class corsConfig {
    @Bean 
    public WebMvcConfigurer corsConfigurer(){
        return new WebMvcConfigurer() {
            @Override 
            public void addCorsMapping(CorsRegistry registry){
                registry.addMapping("/api/**")
                    .allowedHeaders("*")
                    .allowedMethods("GET", "POST", "PUT", "DELETE")
                    .allowedHeaders("*");
            }
        };
    }
}
