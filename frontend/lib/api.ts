"use client";

import axios, { AxiosError } from "axios";
import { useMutation, useQuery } from "@tanstack/react-query";
import { TASASGenerationSchema } from "./schemas";
import { toast } from "sonner";
export { useGenerationStore } from "./store";

export const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

// Shared axios instance with timeout and unified error extraction
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000, // 60s — SAS generation can be slow
});

// Response interceptor: extract detail from error responses for consistent toast messages
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ detail?: string }>) => {
        const detail = error.response?.data?.detail || error.message || "Request failed";
        return Promise.reject(new Error(detail));
    },
);

export const useGenerateSAS = () => {
    return useMutation({
        mutationFn: async (data: TASASGenerationSchema) => {
            const response = await api.post("/generate", data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        },
        onError: (error: Error) => {
            console.error("Generation failed:", error);
            toast.error(error.message || "Failed to generate SAS code");
        },
        onSuccess: () => {
            toast.success("SAS Code generated successfully!");
        },
    });
};

export const useDefaultConfig = () => {
    return useQuery({
        queryKey: ["defaults"],
        queryFn: async () => {
            const response = await api.get("/config/defaults");
            return response.data;
        },
    });
};

export const useTemplates = () => {
    return useQuery({
        queryKey: ["templates"],
        queryFn: async () => {
            const response = await api.get("/templates");
            return response.data;
        },
    });
};

export const useTemplateContent = (templateName: string | null) => {
    return useQuery({
        queryKey: ["template", templateName],
        queryFn: async () => {
            if (!templateName) return null;
            const response = await api.get(`/templates/${templateName}`);
            return response.data;
        },
        enabled: !!templateName,
    });
};

export const useAppVersion = () => {
    return useQuery({
        queryKey: ["app-version"],
        queryFn: async () => {
            const response = await api.get("/app/version");
            return response.data;
        },
    });
};
