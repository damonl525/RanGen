import { z } from "zod";

export const TreatmentArmSchema = z.object({
    armcd: z.string().min(1, "Code is required"),
    arm: z.string().min(1, "Name is required"),
    ratio: z.coerce.number().min(0, "Ratio must be non-negative"),
});

export const StratificationFactorSchema = z.object({
    name: z.string().min(1, "Factor name is required"),
    levels: z.array(z.string()).min(2, "At least 2 levels required"),
});

export const SubProtocolSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    treatment_arms: z.array(TreatmentArmSchema).min(1, "At least 1 arm required"),
    block_size: z.coerce.number().min(2, "Block size >= 2"),
    blocks_per_stratum: z.coerce.number().min(1, "Blocks per stratum >= 1"),
    total_sample_size: z.coerce.number().min(1, "Sample size >= 1"),
});

export const SASGenerationSchema = z.object({
    study_id: z.string().min(1, "Study ID is required"),
    protocol_title: z.string().min(1, "Title is required"),
    client: z.string().min(1, "Client is required"),
    company: z.string().min(1, "Company is required"),
    status: z.enum(["Draft", "Final"]).default("Draft"),

    is_double_blind: z.boolean().default(true),

    treatment_arms: z.array(TreatmentArmSchema).min(2, "At least 2 treatment arms required"),

    total_sample_size: z.coerce.number().min(1, "Sample size must be positive"),
    block_size: z.coerce.number().min(1, "Block size must be positive"),
    blocks_per_stratum: z.coerce.number().min(1, "Blocks per stratum must be positive"),

    // Supplier
    supplier: z.string().default("General"),

    // Multi-Protocol Support
    multi_protocol: z.boolean().default(false),
    protocols: z.array(SubProtocolSchema).default([]),
    main_study_name: z.string().default("主方案"),

    macro_type: z.enum(["标准", "可变"]).default("标准"),
    variable_block_enabled: z.boolean().default(false),
    // We will handle the comma-separated string transformation in the form component or a refined schema wrapper
    // For the core schema, we keep it as array of numbers or allow it to be optional
    variable_block_sizes: z.array(z.coerce.number()).optional(),

    stratification_factors: z.array(z.string()).default([]), // Simplified for form, detailed mapping handled in logic
    strata_levels: z.record(z.string(), z.array(z.string())).default({}),

    start_subject_number: z.coerce.number().min(1).default(1),
    subject_number_prefix: z.string().default("R"),
    subject_number_length: z.coerce.number().min(1).default(4),
    num_gap: z.coerce.number().default(0),

    subject_seed: z.string().default("RANDOM"),
    drug_seed: z.string().default("RANDOM"),

    mirror_replacement: z.boolean().default(false),
    mirror_gap: z.coerce.number().default(1000),

    // Advanced / Optional
    allocation_ratio: z.string().default("1:1"),

    // Server Execution Settings
    is_server_run: z.boolean().default(false),
    server_path: z.string().optional(),

    // Drug Randomization
    drug_randomization_config: z.object({
        enabled: z.boolean().default(false),
        drug_arms: z.array(z.object({
            code: z.string().min(1),
            name: z.string().min(1),
            ratio: z.coerce.number().min(0)
        })).default([]),
        drug_block_size: z.coerce.number().min(1).default(4),
        drug_block_layers: z.coerce.number().min(1).default(10), // Similar to blocks_per_stratum
        drug_start_number: z.coerce.number().min(1).default(1),
        drug_number_prefix: z.string().default("D"),
        drug_number_length: z.coerce.number().min(1).default(4),
        drug_num_gap: z.coerce.number().default(0),
        drug_report_units: z.string().default("瓶"),
        drug_sec_rand_enabled: z.boolean().default(false),
        // Simplified drug stratification for now (similar to subject stratification)
        drug_stratification_factors: z.array(z.string()).default([]),
        drug_strata_levels: z.record(z.string(), z.array(z.string())).default({}),
        // Batch Configs: Record<FactorName, Record<LevelName, BatchConfig[]>>
        drug_batch_configs: z.record(z.string(), z.any()).default({})
    }).optional(),
});

export type TASASGenerationSchema = z.infer<typeof SASGenerationSchema>;
export type TTreatmentArm = z.infer<typeof TreatmentArmSchema>;
