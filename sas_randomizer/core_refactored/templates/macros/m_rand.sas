%macro m_rand(
    Strata=, /*split by |*/
    Block=, /*number of blocks*/
    Rand=, /*block size*/
    out=, /*output dataset name*/
    startNo=1,
    Prefix=,
    suffix=,
    seed=,
    armcd=, /*split by |*/
    arm=, /*split by |*/
    num_gap=0, /* Gap between strata for subject numbering */
    VarBlock=N, /* Variable block randomization flag */
    VarBlockSizes=, /* Variable block sizes (e.g., 4|6) */
    TotalN=, /* Total sample size for variable block randomization */
    protocol= /* Protocol name for multi-protocol support */
);

    %local _i _len _Narm Nstrata _varblock_size1 _varblock_size2;

    /* 修复：正确计算分层数量，处理空值情况 */
    %if %length(&Strata) > 0 %then %do;
        %let Nstrata = %eval(%sysfunc(countw(&Strata,|)));
    %end;
    %else %do;
        %let Nstrata = 0;
    %end;

    %let _Narm = %eval(%sysfunc(countw(&arm,|)));

    /* Parse variable block sizes if enabled */
    %if %upcase(&VarBlock) = Y %then %do;
        %let _varblock_size1 = %scan(&VarBlockSizes, 1, |);
        %let _varblock_size2 = %scan(&VarBlockSizes, 2, |);
    %end;

    /* PROC PLAN处理：支持标准区组和可变区组 */
    %if %upcase(&VarBlock) = Y %then %do;
        /* 可变区组处理 - 简化分层处理，每个分层使用相同的总样本量 */

        /*--- Step 1: 解析参数并验证 ---*/
        %let size1 = %scan(&VarBlockSizes, 1, |);
        %let size2 = %scan(&VarBlockSizes, 2, |);

        /* 验证TotalN参数 */
        %if %length(&TotalN) = 0 or &TotalN <= 0 %then %do;
            %put ERROR: TotalN参数必须是一个正整数。当前值: &TotalN;
            %return;
        %end;

        %if &Nstrata > 0 %then %do;
            %put NOTE: 使用分层可变区组随机化，分层数=&Nstrata，每层样本量=&TotalN，区组大小=&size1,&size2;
        %end;
        %else %do;
            %put NOTE: 使用可变区组随机化，总样本量=%str(&TotalN)，区组大小=&size1,&size2;
        %end;

        /*--- Step 2: 计算最优解（所有分层使用相同配置） ---*/
        /* 寻找所有可能的(n1, n2)解 */
        data _possible_solutions;
            max_n1 = floor(&TotalN / &size1);
            do n1 = 0 to max_n1;
                remainder_n = &TotalN - (n1 * &size1);
                if remainder_n >= 0 and mod(remainder_n, &size2) = 0 then do;
                    n2 = remainder_n / &size2;
                    balance_diff = abs(n1 - n2);
                    total_blocks = n1 + n2;
                    output;
                end;
            end;
            keep n1 n2 balance_diff total_blocks;
        run;

        /* 检查是否找到解 */
        proc sql noprint;
            select count(*) into :solution_count from _possible_solutions;
        quit;

        %if &solution_count = 0 %then %do;
            %put ERROR: 无法使用区组大小 &size1 和 &size2 来精确达到总样本量 &TotalN;
            %put ERROR: 请检查参数设置或选择其他区组大小组合。;
            %return;
        %end;

        /* 按平衡度排序，选择最优解 */
        proc sort data=_possible_solutions out=_best_solution;
            by balance_diff total_blocks;
        run;

        data _null_;
            set _best_solution;
            if _n_ = 1;
            call symputx('n1', n1);
            call symputx('n2', n2);
            call symputx('total_blocks', total_blocks);
            call symputx('balance_diff', balance_diff);
        run;
        %if &Nstrata > 0 %then %do;
            %put NOTE: 所有分层使用相同最优解: &size1.大小区组 &n1 个，&size2.大小区组 &n2 个，平衡度差异 &balance_diff;
        %end;
        %else %do;
            %put NOTE: 选择最优解: &size1.大小区组 &n1 个，&size2.大小区组 &n2 个，平衡度差异 &balance_diff;
        %end;

        /*--- Step 3: 生成可变区组随机化结果 ---*/
        %if &Nstrata > 0 %then %do;
            /* 分层可变区组：与非分层逻辑一致，分别为两种区组做 PROC PLAN */

            /*--- 为每个分层分别生成两种大小的区组 ---*/
            %if &n1 > 0 %then %do;
                /* 生成size1大小的区组，每个分层&n1个 */
                proc plan seed=&seed;
                    factors StrataN = &Nstrata ordered
                            block = &n1 ordered
                            rand = &size1 random;
                    output out=rand_size1;
                run;
                data rand_size1;
                    set rand_size1;
                    block_size = &size1;
                    /* 使用rand变量进行治疗分配，与标准区组一致 */
                    block_type = 1;
                    /* 调整block编号，每个分层从1开始 */
                    block_original = block;
                run;
            %end;

            %if &n2 > 0 %then %do;
                /* 生成size2大小的区组，每个分层&n2个 */
                proc plan seed=&seed;
                    factors StrataN = &Nstrata ordered
                            block = &n2 ordered
                            rand = &size2 random;
                    output out=rand_size2;
                run;
                data rand_size2;
                    set rand_size2;
                    block_size = &size2;
                    /* 使用rand变量进行治疗分配，与标准区组一致 */
                    block_type = 2;
                    /* 调整block编号，继续编号 */
                    block_original = block + &n1;
                run;
            %end;

            /*--- 合并所有分层的区组 ---*/
            data combined_rand;
                set %if &n1 > 0 %then %do; rand_size1 %end;
                    %if &n2 > 0 %then %do; rand_size2 %end;;
            run;

            /*--- 为每个分层分别进行区组顺序随机化 ---*/
            data _all_rand_combined;
                /* 初始化空数据集 */
                if 0;
            run;

            /* 遍历每个分层 */
            %do strata_i = 1 %to &Nstrata;
                /* 获取当前分层的区组 */
                data _strata_blocks;
                    set combined_rand;
                    where StrataN = &strata_i;
                run;

                /* 为当前分层的区组随机排序 */
                proc sql noprint;
                    create table _strata_block_order as
                    select distinct StrataN, block_original, block_size, block_type 
                    from _strata_blocks;
                quit;

                data _strata_block_order;
                    set _strata_block_order;
                    random_order = ranuni(&seed + &strata_i); /* 为每个分层使用不同种子 */
                run;

                proc sort data=_strata_block_order; by StrataN random_order; run;

                data _strata_block_order;
                    set _strata_block_order;
                    by StrataN;
                    retain block_new;
                    if first.StrataN then block_new = 0;
                    block_new + 1;
                run;

                /* 应用新的区组顺序 */
                proc sql noprint;
                    create table _strata_final as
                    select a.rand, a.block_size as BlockSize, 
                           b.block_new as block,
                           a.block_type, a.StrataN
                    from _strata_blocks as a
                    left join _strata_block_order as b 
                        on a.StrataN = b.StrataN and a.block_original = b.block_original
                    order by a.StrataN, b.block_new;
                quit;

                /* 合并到总结果中 */
                data _all_rand_combined;
                    set _all_rand_combined _strata_final;
                run;

                /* 清理临时数据集 */
                proc delete data=_strata_blocks _strata_block_order _strata_final; run;
            %end;

            /* 设置最终结果 */
            data _Rand1;
                set _all_rand_combined;
            run;

            /* 清理临时数据集 */
            proc delete data=combined_rand _all_rand_combined 
                       %if &n1 > 0 %then %do; rand_size1 %end;
                       %if &n2 > 0 %then %do; rand_size2 %end;; run;
        %end;
        %else %do;
            /* 非分层可变区组 */
            /*--- 分别生成两种大小的区组 ---*/
            %if &n1 > 0 %then %do;
                proc plan seed=&seed;
                    factors block = &n1 ordered
                            rand = &size1 random;
                    output out=rand_size1;
                run;
                data rand_size1;
                    set rand_size1;
                    block_size = &size1;
                    /* 使用rand变量进行治疗分配，与标准区组一致 */
                    block_type = 1;
                    StrataN = 1;  /* 非分层情况设为1 */
                run;
            %end;

            %if &n2 > 0 %then %do;
                proc plan seed=&seed;
                    factors block = &n2 ordered
                            rand = &size2 random;
                    output out=rand_size2;
                run;
                data rand_size2;
                    set rand_size2;
                    block_size = &size2;
                    block = block + &n1; /* 修正block编号 */
                    /* 使用rand变量进行治疗分配，与标准区组一致 */
                    block_type = 2;
                    StrataN = 1;  /* 非分层情况设为1 */
                run;
            %end;

            /*--- 合并并随机打乱区组顺序 ---*/
            data combined_rand;
                set %if &n1 > 0 %then %do; rand_size1 %end;
                    %if &n2 > 0 %then %do; rand_size2 %end;;
            run;

            /* 区组顺序随机化 */
            proc sql noprint;
                create table block_order as
                select distinct block, block_size, block_type from combined_rand;
            quit;

            data block_order;
                set block_order;
                random_order = ranuni(&seed);
            run;

            proc sort data=block_order; by random_order; run;

            data block_order;
                set block_order;
                block_new = _n_;
            run;

            /* 应用新的区组顺序 */
            proc sql noprint;
                create table _Rand1 as
                select a.rand, a.block_size as BlockSize, 
                       b.block_new as block,
                       a.block_type, a.StrataN
                from combined_rand as a
                left join block_order as b on a.block = b.block
                order by b.block_new;
            quit;

            /* 清理临时数据集 */
            proc delete data=combined_rand block_order 
                       %if &n1 > 0 %then %do; rand_size1 %end;
                       %if &n2 > 0 %then %do; rand_size2 %end;; run;
        %end;

        /* 清理临时数据集 */
        proc delete data=_possible_solutions _best_solution; run;
    %end;
    %else %do;
        /* 标准区组处理 */
        proc plan seed=&seed;
           factors
            %if &Nstrata > 0 %then %do;
                StrataN = &Nstrata ordered
            %end;
            Block = &block
            Rand = &rand
            ;
           output out=_Rand1;
        run;
    %end;

    data &out;
        length Studyid Strata SubjNo Armcd Arm protocol $100 Seed $20;
        set _rand1;
        %if &Nstrata > 0 %then %do;
            by StrataN %if %length(&block) > 0 %then %do; Block %end; notsorted;
        %end;
        %else %do;
            %if %length(&block) > 0 %then %do;
                by Block notsorted;
            %end;
        %end;

        retain bn 0;

        /* 只在有分层时处理分层逻辑 */
        %if &Nstrata > 0 %then %do;
            array _strata {&NStrata} $100
            _temporary_   (%sysfunc(tranwrd("&Strata",%str(|),%str(" "))));

            Strata=_Strata{StrataN};
            if first.strataN then do;
                %if %length(&block) %then bn=0;;
            end;
        %end;
        %else %do;
            Strata = "";
            StrataN = 1;
        %end;

        %if %length(&block) > 0 %then %do;
            if first.block then bn + 1;
            %if %upcase(&VarBlock) = Y %then %do;
                Blocksize = BlockSize; /* 使用实际的区组大小 */
            %end;
            %else %do;
                Blocksize = &rand;
            %end;
        %end;
        %else %do;
            bn = 1;
            %if %upcase(&VarBlock) = Y %then %do;
                Blocksize = BlockSize; /* 使用实际的区组大小 */
            %end;
            %else %do;
                Blocksize = &rand;
            %end;
        %end;

        %do _i = 1 %to &_Narm;
            %if &_i = 1 %then %do;
                %if %upcase(&VarBlock) = Y %then %do;
                    if rand <= BlockSize / &_Narm * &_i then do;
                %end;
                %else %do;
                    if rand <= &rand / &_Narm * &_i then do;
                %end;
            %end;
            %else %do;
                %if %upcase(&VarBlock) = Y %then %do;
                    else if rand <= BlockSize / &_Narm * &_i then do;
                %end;
                %else %do;
                    else if rand <= &rand / &_Narm * &_i then do;
                %end;
            %end;
                    ARMCD = "%scan(&armcd,&_i,|)";
                    Arm = "%scan(&arm,&_i,|)";
                end;
        %end;

        %let _len = %length(&StartNo);
        %if &num_gap > 0 and &Nstrata > 0 %then %do;
            subjno = cats("&prefix", put(_N_ + &startNo - 1 + (StrataN - 1) * &num_gap., z&_len..), "&suffix");
        %end;
        %else %do;
            subjno = cats("&prefix", put(_N_ + &startNo - 1, z&_len..), "&suffix");
        %end;
        Seed = "&seed";
        Studyid = "&studyID";

        /* 设置子方案 */
        %if %length(&protocol) > 0 %then %do;
            protocol = "&protocol";
        %end;
        %else %do;
            protocol = '主研究';
        %end;

        %if %upcase(&VarBlock) = Y %then %do;
            keep Studyid Seed StrataN Strata bn Blocksize Block Rand SubjNo Armcd Arm protocol 
                 BlockSize;
        %end;
        %else %do;
            keep Studyid Seed StrataN Strata bn Blocksize Block Rand SubjNo Armcd Arm protocol;
        %end;
    run;

    proc delete data=_rand1; run;
%mend m_rand;
