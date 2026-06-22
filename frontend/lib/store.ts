import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TASASGenerationSchema } from './schemas';

interface GenerationStore {
    config: Partial<TASASGenerationSchema>;
    updateConfig: (newConfig: Partial<TASASGenerationSchema>) => void;
    resetConfig: () => void;
}

const initialEmptyConfig = {
    study_id: '',
    protocol_title: '',
    client: '',
    company: '',
    status: 'Draft' as const,
    is_double_blind: true,
    treatment_arms: [{ armcd: 'A', arm: 'Test', ratio: 1 }, { armcd: 'B', arm: 'Control', ratio: 1 }],
    stratification_factors: [],
    strata_levels: {},
    total_sample_size: 40,
    block_size: 4,
    blocks_per_stratum: 10,
    macro_type: '标准' as const,
    variable_block_enabled: false,
    start_subject_number: 1,
    subject_number_prefix: 'R',
    subject_number_length: 4,
    num_gap: 0,
    subject_seed: '',
    drug_seed: '',
    supplier: 'General',
    mirror_replacement: false,
    mirror_gap: 1000,
    variable_block_sizes: [4, 6],
    allocation_ratio: '1:1',
    multi_protocol: false,
    protocols: [],
    main_study_name: '主方案',
    drug_randomization_config: {
        enabled: false,
        drug_arms: [],
        drug_block_size: 4,
        drug_block_layers: 10,
        drug_start_number: 1,
        drug_number_prefix: 'D',
        drug_number_length: 4,
        drug_num_gap: 0,
        drug_report_units: '瓶',
        drug_sec_rand_enabled: false,
        drug_stratification_factors: [],
        drug_strata_levels: {},
        drug_batch_configs: {}
    }
};

const defaultConfig = {
    ...initialEmptyConfig,
    // Demo values from user test_converted.json
    study_id: 'XXXXXX',
    protocol_title: 'XXXXXX',
    client: 'XXXXXX',
    company: 'XXXXXX',
    status: 'Draft' as const,
    supplier: '供应商B 5.X',
    treatment_arms: [
        { armcd: 'TRT', arm: 'XXXXXX', ratio: 1 },
        { armcd: 'PBO', arm: 'XXXXXX', ratio: 1 }
    ],
    is_double_blind: true,
    stratification_factors: ["筛选时合并的危险因素个数"],
    strata_levels: {
        "筛选时合并的危险因素个数": ["GE3_1", "GE3_2"]
    },
    blocks_per_stratum: 20,
    block_size: 4,
    macro_type: '标准' as const,
    allocation_ratio: '1:1',
    variable_block_enabled: false,
    start_subject_number: 1,
    subject_number_prefix: 'R',
    subject_number_length: 4,
    num_gap: 920,
    total_sample_size: 80,
    subject_seed: '123213412',
    drug_seed: '124325431',
    mirror_replacement: false,
    mirror_gap: 1000,
    multi_protocol: false,
    main_study_name: 'II期',

    drug_randomization_config: {
        ...initialEmptyConfig.drug_randomization_config,
        enabled: true,
        drug_arms: [
            { code: 'A', name: 'XXXXXX', ratio: 1 },
            { code: 'B', name: 'XXXXXX', ratio: 1 }
        ],
        drug_stratification_factors: ["批次"],
        drug_strata_levels: {
            "批次": ["批次"]
        },
        drug_block_size: 4,
        drug_block_layers: 600,
        drug_start_number: 1,
        drug_number_prefix: 'D',
        drug_number_length: 4,
        drug_num_gap: 0,
        drug_report_units: '盒',
        drug_sec_rand_enabled: true,
        drug_batch_configs: {
            supply_factor: "批次",
            configs: {
                "批次": [
                    { batch_no: "1", quantity: 1920 },
                    { batch_no: "2", quantity: 480 }
                ]
            }
        }
    }
};

export const useGenerationStore = create<GenerationStore>()(
    persist(
        (set) => ({
            config: defaultConfig,
            updateConfig: (newConfig) =>
                set((state) => ({
                    config: { ...state.config, ...newConfig }
                })),
            resetConfig: () => set({ config: initialEmptyConfig }),
        }),
        {
            name: 'sas-generation-storage',
        }
    )
);
