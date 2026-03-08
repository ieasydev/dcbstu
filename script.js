// script.js
class WordMatchGame {
    constructor() {
        this.board = document.getElementById('gameBoard');
        this.progressBar = document.getElementById('progressBar');
        //this.completedWords = document.getElementById('completedWords');
        this.wordsData = [];
        this.selectedCards = [];
        this.completedCount = 0;
        this.totalWords = 0;
        this.hanziContainer = document.getElementById('hanziContainer');
        this.hanziGrid = document.getElementById('hanziGrid');
        this.completedHanzis = []; // 存储已完成的汉字
        // 在第 13 行后面添加
        this.lianxiContainer = document.getElementById('lianxiContainer');
        this.lianxiGrid = document.getElementById('lianxiGrid');
        this.currentLianxiIndex = 0;
        this.lianxiMode = 'radical'; // 'both', 'radical', 'main'
        this.lianxiMode = 'radical'; // 'radical', 'main' (删除'both'模式)
        this.pinyinData = {}; // 存储拼音数据
        this.speechSynthesis = window.speechSynthesis; // 语音合成 API
        this.landuContainer = document.getElementById('landuContainer');
        this.currentLanduIndex = 0;
        this.landuData = []; // 存储朗读练习数据
        this.currentLesson = ''; // 当前选中的课程
        this.init();
    }

    async init() {
        await this.loadPinyinData(); // 先加载拼音数据
        await this.loadWordsData();
        this.initLessonSelector(); // 初始化课程选择器
         // 初始化时加载当前课程的游戏和练习
        // 删除后面的重复调用，在这里直接初始化朗读数据
        // 此时 currentLesson 已经被设置好了
        if (this.currentLesson) {
            this.landuData = this.wordsData
                .filter(word => word.kecheng === this.currentLesson)
                .map(word => ({
                    hanzi: word.letter,
                    parts: word.letterSplit.split(' '),
                    pinyin: this.pinyinData[word.letter] || ''
                }));

            if (this.landuData.length > 0) {
                this.showLanduItem(0);
            }
        }
        this.setupLanduControls(); // 设置控制按钮
        this.setupGame();
        this.setupCardNavigation(); // 设置卡片导航
        this.initLanduHanziDisplay(); // 初始化朗读区汉字展示
        this.setupLianxiControls(); // 设置练习区控制按钮
        this.setupHintToggle(); // 设置提示切换按钮
        this.initGameHanziDisplay(); // 初始化游戏区汉字提示
    }
    // 设置课程选择按钮
    setupLessonSelectBtn() {
        const lessonSelectBtn = document.getElementById('lessonSelectBtn');
        const lessonSelect = document.getElementById('lessonSelect');

        if (!lessonSelectBtn || !lessonSelect) return;

        // 点击图标按钮时显示/隐藏下拉菜单
        lessonSelectBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = lessonSelect.style.display !== 'none';
            lessonSelect.style.display = isVisible ? 'none' : 'block';
        });

        // 点击页面其他地方时关闭下拉菜单
        document.addEventListener('click', () => {
            lessonSelect.style.display = 'none';
        });

        // 阻止点击下拉菜单时关闭
        lessonSelect.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    // 新增方法：从CSV文件加载拼音数据
    async loadPinyinData() {
        try {
            const response = await fetch('arctDemo.csv');
            const csvText = await response.text();

            // 解析CSV数据
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');

            // 找到各列的索引
            const letterIndex = headers.indexOf('letter');
            const letterpyIndex = headers.indexOf('letterpy');

            // 处理数据行
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    if (values[letterIndex] && values[letterpyIndex]) {
                        this.pinyinData[values[letterIndex].trim()] = values[letterpyIndex].trim();
                    }
                }
            }

            console.log('拼音数据加载完成:', this.pinyinData);
        } catch (error) {
            console.error('加载拼音数据失败:', error);
            // 如果加载失败，使用默认数据
            this.pinyinData = {
                '融': 'róng',
                '燕': 'yàn',
                '鸳': 'yuān',
                '鸯': 'yāng',
                '惠': 'huì',
                '崇': 'chóng',
                '芽': 'yá',
                '梅': 'méi',
                '泛': 'fàn',
                '减': 'jiǎn'
            };
        }
    }

    async loadWordsData() {
        try {
            const response = await fetch('arctDemo.csv');
            const csvText = await response.text();

            const lines = csvText.split('\n');
            const headers = lines[0].split(',');

            const letterIndex = headers.indexOf('letter');
            const letterSplitIndex = headers.indexOf('letterSplit');
            const zuciIndex = 4;//headers.indexOf('zuci'); // 获取组词列索引
            const kechengIndex = headers.indexOf('kecheng'); // 获取课程列索引

            console.log('CSV 列索引:', {
                letter: letterIndex,
                letterSplit: letterSplitIndex,
                zuci: zuciIndex,
                kecheng: kechengIndex
            });

            this.wordsData = [];
            this.lessonsSet = new Set(); // 存储所有课程

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    if (values[letterIndex]) {  // 只要求 letter 列有值
                        const wordData = {
                            letter: values[letterIndex].trim(),
                            letterSplit: values[letterSplitIndex] ? values[letterSplitIndex].trim() : '',
                            kecheng: values[kechengIndex] ? values[kechengIndex].trim() : ''
                        };

                        // 如果有组词数据，添加到对象中
                        if (zuciIndex !== -1 && values[zuciIndex]) {
                            wordData.zuci = values[zuciIndex].trim();
                        } else {
                            wordData.zuci = '';
                        }

                        this.wordsData.push(wordData);

                        // 添加到课程集合
                        if (wordData.kecheng) {
                            this.lessonsSet.add(wordData.kecheng);
                        }
                    }
                }
            }

            console.log('单词数据加载完成，总数:', this.wordsData.length);
            console.log('前 5 个字的数据:', this.wordsData.slice(0, 5));
            console.log('前 5 个字的组词:', this.wordsData.slice(0, 5).map(w => w.zuci));
        } catch (error) {
            console.error('加载单词数据失败:', error);
        }

        // 提取所有 letterSplit 的字符（不去重）
        const allCharacters = [];
        this.wordsData.forEach(word => {
            if (word.letterSplit) {  // 只有有部件数据的才加入游戏
                allCharacters.push(...word.letterSplit.split(' '));
            }
        });

        this.allCharacters = allCharacters; // 保留所有字符
        this.totalWords = this.wordsData.length;
    }

    initLanduHanziDisplay() {
        const landuHanziGrid = document.getElementById('landuHanziGrid');
        if (!landuHanziGrid) return;

        landuHanziGrid.innerHTML = '';

        // 显示所有汉字（去重）- 根据选择的课程过滤
        let allHanzis = [];
        const lessonSelect = document.getElementById('lessonSelect');

        if (lessonSelect && lessonSelect.value) {
            const selectedLesson = lessonSelect.value;
            // 只获取当前课程的汉字
            const lessonWords = this.wordsData.filter(word => word.kecheng === selectedLesson);
            allHanzis = [...new Set(lessonWords.map(word => word.letter))];

            console.log(`当前课程：${selectedLesson}, 汉字数：${allHanzis.length}`);
            console.log('当前课程的汉字:', allHanzis.slice(0, 10));
        } else {
            // 未选择课程，显示所有汉字
            allHanzis = [...new Set(this.wordsData.map(word => word.letter))];
            console.log('未选择课程，显示所有汉字');
        }

        console.log('总汉字数:', allHanzis.length);

        allHanzis.forEach((hanzi, index) => {
            const hanziItem = document.createElement('div');
            hanziItem.className = 'landu-hanzi-item';

            // 创建汉字容器
            const hanziCharDiv = document.createElement('div');
            hanziCharDiv.className = 'landu-hanzi-character';
            hanziCharDiv.id = `landu-hanzi-${hanzi}`;

            // 添加拼音显示
            const pinyinDiv = document.createElement('div');
            pinyinDiv.className = 'landu-hanzi-pinyin';
            pinyinDiv.textContent = this.pinyinData[hanzi] || '';

            // 添加组词显示
            const zuciDiv = document.createElement('div');
            zuciDiv.className = 'landu-hanzi-zuci';

            // 查找该汉字的组词数据 - 在整个 wordsData 中查找
            const wordData = this.wordsData.find(word => word.letter === hanzi);

            if (wordData && wordData.zuci) {
                zuciDiv.textContent = wordData.zuci;//.replace(/\s+/g, ' | ');;
                console.log(`✓ ${hanzi}: ${wordData.zuci}`);
            } else {
                zuciDiv.textContent = '';
                console.log(`✗ ${hanzi}: 无组词`);
            }

            hanziItem.appendChild(hanziCharDiv);
            hanziItem.appendChild(pinyinDiv);
            hanziItem.appendChild(zuciDiv);
            landuHanziGrid.appendChild(hanziItem);

            // 使用 hanzi-writer 渲染汉字
            this.renderLanduHanziSmall(hanzi, hanziCharDiv.id);
        });

        console.log('朗读区汉字展示初始化完成');
    }

    // 初始化课程选择器
    // 初始化课程选择器
    // 初始化课程选择器
    // 初始化课程选择器
    initLessonSelector() {
        const lessonSelect = document.getElementById('lessonSelect');
        if (!lessonSelect) return;

        // 将课程集合转换为数组并排序
        const lessons = Array.from(this.lessonsSet).sort();

        // 清空选项（保留第一个"选择课程"）
        lessonSelect.innerHTML = '<option value="">选择课程</option>';

        // 添加课程选项
        lessons.forEach(lesson => {
            const option = document.createElement('option');
            option.value = lesson;
            option.textContent = lesson;
            lessonSelect.appendChild(option);
        });

        // 默认选择第一个课程
        if (lessons.length > 0) {
            const firstLesson = lessons[0];
            lessonSelect.value = firstLesson;
            this.currentLesson = firstLesson; // 设置全局课程变量
            console.log('默认选择第一课:', firstLesson);
        }

        // 监听选择变化
        // 监听选择变化
        lessonSelect.addEventListener('change', () => {
            this.currentLesson = lessonSelect.value; // 更新全局课程变量
            console.log('切换到课程:', this.currentLesson);

            this.initLanduHanziDisplay(); // 重新渲染汉字列表
            this.initGameHanziDisplay(); // 重新渲染游戏区汉字提示
            // 同时更新朗读练习的数据
            if (lessonSelect.value) {
                this.landuData = this.wordsData
                    .filter(word => word.kecheng === lessonSelect.value)
                    .map(word => ({
                        hanzi: word.letter,
                        parts: word.letterSplit.split(' '),
                        pinyin: this.pinyinData[word.letter] || ''
                    }));

                if (this.landuData.length > 0) {
                    this.currentLanduIndex = 0;
                    this.showLanduItem(0);
                }
            } else {
                // 如果没有选择课程，恢复所有数据
                this.initLanduData();
            }

            // 重新初始化游戏和练习
            this.initGameWithCurrentLesson();
            this.initLianxiWithCurrentLesson();

            // 更新进度显示为当前课程的字数
            const currentLessonCount = lessonSelect.value ?
                this.wordsData.filter(word => word.kecheng === lessonSelect.value).length :
                this.wordsData.length;
            console.log(`当前课程字数：${currentLessonCount}`);
        });

        // 初始化时加载当前课程的游戏和练习
        this.initGameWithCurrentLesson();
        this.initLianxiWithCurrentLesson();

        // 初始化时也要设置正确的进度显示（默认为第一个课程的字数）
        if (this.currentLesson) {
            const firstLessonCount = this.wordsData.filter(word => word.kecheng === this.currentLesson).length;
            console.log(`第一课字数：${firstLessonCount}`);
        }
    }
    // 根据当前课程初始化游戏
    initGameWithCurrentLesson() {
        if (this.board) {
            this.setupGame();
        }
    }
    // 缩小版汉字渲染（用于朗读区展示）
    renderLanduHanziSmall(character, targetId) {
        const radicalConfig = this.getRadicalColorConfig(character);

        const writer = HanziWriter.create(targetId, character, {
            width: 40,
            height: 40,
            padding: 2,
            strokeColor: '#1E90FF',
            radicalColor: '#FF0000',
            delayBetweenStrokes: 150,
            strokeAnimationSpeed: 1
        });

        setTimeout(() => {
            writer.animateCharacter({
                onComplete: () => {
                    console.log(`朗读区汉字 ${character} 小尺寸动画完成`);
                }
            });
        }, 300);
    }

    setupCardNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // 移除所有按钮的 active 类
                navBtns.forEach(b => b.classList.remove('active'));
                // 添加当前按钮的 active 类
                btn.classList.add('active');
                
                // 隐藏所有内容卡片
                const contents = document.querySelectorAll('.card-content');
                contents.forEach(content => content.classList.remove('active'));
                
                // 显示目标卡片
                const targetId = btn.getAttribute('data-target');
                document.getElementById(targetId).classList.add('active');
            });
        });
    }

    // 设置提示切换按钮
    setupHintToggle() {
        const toggleBtn = document.getElementById('toggleHintBtn');
        const hintContent = document.getElementById('hintContent');

        if (!toggleBtn || !hintContent) return;

        toggleBtn.addEventListener('click', () => {
            const isHidden = hintContent.style.display === 'none';
            hintContent.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? '📖 隐藏汉字提示' : '📖 显示汉字提示';
        });
    }

    // 初始化游戏区汉字提示显示
    initGameHanziDisplay() {
        const gameHanziGrid = document.getElementById('gameHanziGrid');
        if (!gameHanziGrid) return;

        gameHanziGrid.innerHTML = '';

        // 显示所有汉字（去重）- 根据选择的课程过滤
        let allHanzis = [];
        const lessonSelect = document.getElementById('lessonSelect');

        if (lessonSelect && lessonSelect.value) {
            const selectedLesson = lessonSelect.value;
            // 只获取当前课程的汉字
            const lessonWords = this.wordsData.filter(word => word.kecheng === selectedLesson);
            allHanzis = [...new Set(lessonWords.map(word => word.letter))];

            console.log(`游戏提示 - 当前课程：${selectedLesson}, 汉字数：${allHanzis.length}`);
        } else {
            // 未选择课程，显示所有汉字
            allHanzis = [...new Set(this.wordsData.map(word => word.letter))];
            console.log('游戏提示 - 未选择课程，显示所有汉字');
        }

        allHanzis.forEach((hanzi, index) => {
            const hanziItem = document.createElement('div');
            hanziItem.className = 'landu-hanzi-item';

            // 创建汉字容器
            const hanziCharDiv = document.createElement('div');
            hanziCharDiv.className = 'landu-hanzi-character';
            hanziCharDiv.id = `game-hanzi-${hanzi}`;

            // 添加拼音显示
            const pinyinDiv = document.createElement('div');
            pinyinDiv.className = 'landu-hanzi-pinyin';
            pinyinDiv.textContent = this.pinyinData[hanzi] || '';

            // 添加组词显示
            const zuciDiv = document.createElement('div');
            zuciDiv.className = 'landu-hanzi-zuci';

            // 查找该汉字的组词数据 - 在整个 wordsData 中查找
            const wordData = this.wordsData.find(word => word.letter === hanzi);

            if (wordData && wordData.zuci) {
                zuciDiv.textContent = wordData.zuci;//.replace(/\s+/g, ' | ');
            } else {
                zuciDiv.textContent = '';
            }

            hanziItem.appendChild(hanziCharDiv);
            hanziItem.appendChild(pinyinDiv);
            hanziItem.appendChild(zuciDiv);
            gameHanziGrid.appendChild(hanziItem);

            // 使用 hanzi-writer 渲染汉字
            this.renderGameHanziSmall(hanzi, hanziCharDiv.id);
        });

        console.log('游戏区汉字提示初始化完成');
    }

    // 缩小版汉字渲染（用于游戏提示区）
    renderGameHanziSmall(character, targetId) {
        const radicalConfig = this.getRadicalColorConfig(character);

        const writer = HanziWriter.create(targetId, character, {
            width: 40,
            height: 40,
            padding: 2,
            strokeColor: '#1E90FF',
            radicalColor: '#FF0000',
            delayBetweenStrokes: 150,
            strokeAnimationSpeed: 1
        });

        setTimeout(() => {
            writer.animateCharacter({
                onComplete: () => {
                    console.log(`游戏提示区汉字 ${character} 小尺寸动画完成`);
                }
            });
        }, 300);
    }

    setupGame() {
        // 根据当前课程过滤字符
        let gameCharacters = [];

        if (this.currentLesson) {
            // 只使用当前课程的部件
            const currentLessonWords = this.wordsData.filter(word => word.kecheng === this.currentLesson);
            currentLessonWords.forEach(word => {
                if (word.letterSplit) {
                    gameCharacters.push(...word.letterSplit.split(' '));
                }
            });
        } else {
            // 没有选择课程，使用所有字符
            gameCharacters = [...this.allCharacters];
        }

        // 打乱字符
        this.shuffleArray(gameCharacters);

        // 创建游戏面板
        this.board.innerHTML = ''; // 清空现有面板
        gameCharacters.forEach(char => {
            const card = document.createElement('div');
            card.className = 'card';
            card.textContent = char;
            card.addEventListener('click', () => this.selectCard(card, char));
            this.board.appendChild(card);
        });

        console.log(`游戏初始化完成，当前课程：${this.currentLesson}, 字符数：${gameCharacters.length}`);
    }

    // 设置练习区控制按钮
    setupLianxiControls() {
        const startBtn = document.getElementById('startLianxiBtn');
        const nextBtn = document.getElementById('nextLianxiBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startLianxi();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.nextLianxi();
            });
        }
    }

    showLianxiArea() {
        // 切换到练习卡片
        this.switchToCard('lianxiContainer');

        // 添加提示信息
        document.getElementById('lianxiProgress').textContent = '准备开始...';
    }
    startLianxi() {
        this.currentLianxiIndex = 0;
        this.lianxiGrid.innerHTML = '';
        document.getElementById('startLianxiBtn').style.display = 'none';
        document.getElementById('nextLianxiBtn').style.display = 'inline-block';

        this.showNextLianxiCharacter();
        // 开始时朗读第一个汉字
        this.speakCurrentCharacter();
    }

    // 初始化朗读练习数据
    // 初始化朗读练习数据
    initLanduData() {
        // 如果有当前课程，只使用该课程的数据
        if (this.currentLesson) {
            this.landuData = this.wordsData
                .filter(word => word.kecheng === this.currentLesson)
                .map(word => ({
                    hanzi: word.letter,
                    parts: word.letterSplit.split(' '),
                    pinyin: this.pinyinData[word.letter] || ''
                }));
        } else {
            // 没有选择课程，使用所有数据
            this.landuData = this.wordsData.map(word => ({
                hanzi: word.letter,
                parts: word.letterSplit.split(' '),
                pinyin: this.pinyinData[word.letter] || ''
            }));
        }

        if (this.landuData.length > 0) {
            this.showLanduItem(0);
        }
    }

    // 设置朗读控制按钮
    setupLanduControls() {
        document.getElementById('prevBtn').addEventListener('click', () => {
            this.previousLandu();
        });

        document.getElementById('readBtn').addEventListener('click', () => {
            this.readCurrentLandu();
        });

        document.getElementById('nextBtn').addEventListener('click', () => {
            this.nextLandu();
        });
    }

    // 显示当前朗读项
    // 显示当前朗读项
    showLanduItem(index) {
        if (index < 0 || index >= this.landuData.length) return;

        this.currentLanduIndex = index;
        const item = this.landuData[index];

        // 构建完整的结构显示：支持多个部分 A+B+C+D+E=汉字，都带拼音
        const structureHtml = this.buildStructureDisplay(item.parts, item.hanzi);
        document.querySelector('.structure-display').innerHTML = structureHtml;

        // 移除单独的拼音显示
        // document.getElementById('pinyinDisplay').textContent = item.pinyin;

        // 更新进度
        document.getElementById('landuProgress').textContent =
            `${index + 1}/${this.landuData.length}`;

        // 更新按钮状态
        document.getElementById('prevBtn').disabled = index === 0;
        document.getElementById('nextBtn').disabled = index === this.landuData.length - 1;
    }


    // 构建汉字结构显示 HTML - 支持多部分显示，带拼音
    // 构建汉字结构显示 HTML - 支持多部分显示，所有元素都带拼音
    buildStructureDisplay(parts, hanzi) {
        if (!parts || parts.length === 0) {
            // 即使没有部件，也要显示汉字和拼音
            const hanziPinyin = this.pinyinData[hanzi] || '';
            return `
                <div class="part-container">
                    <span class="result-hanzi">${hanzi}</span>
                    ${hanziPinyin ? `<div class="part-pinyin">${hanziPinyin}</div>` : ''}
                </div>
            `;
        }

        // 创建每个部分的显示元素，包含拼音
        const partElements = parts.map((part, index) => {
            // 获取部件的拼音
            const pinyin = this.getComponentPinyin(part) || '';
            return `
                <div class="part-container">
                    <span class="part" data-index="${index}">${part}</span>
                    ${pinyin ? `<div class="part-pinyin">${pinyin}</div>` : ''}
                </div>
            `;
        });

        // 获取完整汉字的拼音
        const hanziPinyin = this.pinyinData[hanzi] || '';

        // 用加号连接各个部分
        const structure = partElements.join('<span class="plus">+</span>');

        // 添加等号和结果汉字（也包含拼音）
        const resultWithPinyin = `
            <div class="part-container">
                <span class="result-hanzi">${hanzi}</span>
                ${hanziPinyin ? `<div class="part-pinyin">${hanziPinyin}</div>` : ''}
            </div>
        `;

        return `${structure}<span class="equals">=</span>${resultWithPinyin}`;
    }


    // 获取汉字部件的拼音 - 修正版
    getComponentPinyin(component) {
        // 更准确的部件拼音映射
        const componentPinyinMap = {
            // 常见偏旁部首
            '艹': 'cǎo',      // 草字头
            '氵': 'shuǐ',     // 三点水
            '冫': 'bīng',     // 两点水/冰字旁
            '灬': 'huǒ',      // 四点底(火)
            '钅': 'jīn',      // 金字旁
            '木': 'mù',       // 木字旁
            '火': 'huǒ',      // 火字旁
            '土': 'tǔ',       // 土字旁
            '石': 'shí',      // 石字旁
            '竹': 'zhú',      // 竹字头
            '米': 'mǐ',       // 米字旁
            '纟': 'sī',       // 绞丝旁
            '衤': 'yī',       // 衣字旁
            '礻': 'shì',      // 示字旁
            '讠': 'yán',      // 言字旁
            '辶': 'chuò',     // 走之底
           // '阝': 'fù',       // 阜字旁(右耳旁)
            '卩': 'jié',      // 卩字旁
            '阝': 'yì',       // 邑字旁(左耳旁)

            // 常见部件
            '鬲': 'lì',       // 鬲字
            '虫': 'chóng',    // 虫字
            '廿': 'niàn',     // 廿字(二十)
            '北': 'běi',      // 北字
            '口': 'kǒu',      // 口字
            '夗': 'yuàn',     // 夗字
            '鸟': 'niǎo',     // 鸟字
            '央': 'yāng',     // 央字
            '一': 'yī',       // 一字
            '由': 'yóu',      // 由字
            '厶': 'sī',       // 厶字
            '心': 'xīn',      // 心字
            '山': 'shān',     // 山字
            '宗': 'zōng',     // 宗字
            '牙': 'yá',       // 牙字
            '每': 'měi',      // 每字
            '乏': 'fá',       // 乏字
            '咸': 'xián',     // 咸字

            // 其他常见部件
            '人': 'rén',
            '亻': 'rén',      // 单人旁
            '女': 'nǚ',
            '子': 'zǐ',
            '日': 'rì',
            '月': 'yuè',
            '田': 'tián',
            '目': 'mù',
            '耳': 'ěr',
            '手': 'shǒu',
            '扌': 'shǒu',     // 提手旁
            '足': 'zú',
            '⻊': 'zú',       // 足字旁
            '车': 'chē',
            '马': 'mǎ',
            '鱼': 'yú',
            '犬': 'quǎn',
            '犭': 'quǎn',     // 犬字旁
            '牛': 'niú',
            '羊': 'yáng'
        };

        return componentPinyinMap[component] || '';
    }


    // 上一个
    previousLandu() {
        if (this.currentLanduIndex > 0) {
            this.showLanduItem(this.currentLanduIndex - 1);
        }
    }

    // 下一个
    nextLandu() {
        if (this.currentLanduIndex < this.landuData.length - 1) {
            this.showLanduItem(this.currentLanduIndex + 1);
        }
    }

    // 朗读当前项 - 直接读出结构 A+B+C+D+E=汉字
    readCurrentLandu() {
        const currentItem = this.landuData[this.currentLanduIndex];

        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();

            // 直接读出结构：A加B加C加D加E等于汉字
            let textToRead = '';

            if (currentItem.parts && currentItem.parts.length > 0) {
                // 读出各部分，用"加"连接
                textToRead += currentItem.parts.join('加');
                // 读出等号
                textToRead += '等于';
                // 读出完整汉字
                textToRead += currentItem.hanzi;
            } else {
                // 如果没有部分信息，直接读汉字
                textToRead = currentItem.hanzi;
            }

            const utterance = new SpeechSynthesisUtterance(textToRead);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.7; // 适中的语速
            utterance.pitch = 1;
            utterance.volume = 1;

            console.log(`朗读: ${textToRead}`);
            this.speechSynthesis.speak(utterance);
        }
    }




    selectCard(card, char) {
        // 如果卡片已被选中，则取消选中
        if (card.classList.contains('selected')) {
            card.classList.remove('selected');
            this.selectedCards = this.selectedCards.filter(item => item.element !== card);
            return;
        }

        // 限制最多选择6个部件
        if (this.selectedCards.length >= 6) return;

        card.classList.add('selected');
        this.selectedCards.push({ element: card, char: char });

        // 每次选择后立即尝试匹配
        this.checkMatch();
    }


    checkMatch() {
        // 获取当前选中的字符并排序
        const selectedChars = this.selectedCards.map(item => item.char).sort().join(' ');

        // 查找是否有目标字可以由当前选中的字符组成
        const matchedWord = this.wordsData.find(word => {
            const requiredChars = word.letterSplit.split(' ').sort().join(' ');
            return requiredChars === selectedChars;
        });

        if (matchedWord) {
            this.completeWord(matchedWord.letter);
            // 隐藏已使用的卡片
            this.selectedCards.forEach(item => {
                item.element.style.visibility = 'hidden';
            });
            // 清空选择
            this.selectedCards = [];
        } else if (this.selectedCards.length >= 6) {
            // 如果达到最大数量仍未匹配成功，则取消选中状态
            this.selectedCards.forEach(item => {
                item.element.classList.remove('selected');
            });
            // 清空选择
            this.selectedCards = [];
        }
    }




    completeWord(letter) {
        this.completedCount++;
        /*const wordElement = document.createElement('div');
        wordElement.className = 'completed-word';
        wordElement.textContent = letter;
        this.completedWords.appendChild(wordElement);*/

        // 添加到汉字展示区域
        this.showSuccessHanzi(letter);
        // 播放拼音读音替代原来的音乐
        this.speakPinyin(letter);
        // 播放成功音效
        //const successSound = new Audio('success.mp3');
        //successSound.play();

        // 触发鼓励动画
        /*wordElement.classList.add('success-animation');*/

        // 更新进度条
        //const progress = (this.completedCount / this.totalWords) * 100;
        //this.progressBar.style.width = `${progress}%`;

        if (this.completedCount === this.totalWords) {
            this.recordLevelToServer(); // 调用 Node.js 服务
            setTimeout(() => {
                alert('恭喜！你完成了所有单词！');
                this.showLianxiArea(); // 显示练习区域
            }, 500);
        }
    }

    // 显示成功汉字（大字淡出效果）
    // 显示成功汉字（透明弹窗效果）
     // 显示成功汉字（透明弹窗效果）
    showSuccessHanzi(letter) {
        // 获取游戏面板容器
        const gameBoardContainer = document.getElementById('gameBoardContainer');

        // 创建弹窗容器
        const popup = document.createElement('div');
        popup.className = 'success-popup';

        // 创建汉字容器（用于 hanzi-writer 渲染）
        const hanziDiv = document.createElement('div');
        hanziDiv.className = 'success-hanzi-canvas';
        hanziDiv.id = `success-hanzi-${Date.now()}`; // 设置唯一 ID

        // 添加到弹窗
        popup.appendChild(hanziDiv);

        // 添加到容器（先添加到 DOM）
        gameBoardContainer.appendChild(popup);

        // 等待元素添加到 DOM 后再渲染
        setTimeout(() => {
            this.renderSuccessHanzi(letter, hanziDiv.id);
        }, 10);

        // 强制重绘后添加动画类（开始弹出）
        setTimeout(() => {
            popup.classList.add('show');
        }, 100);

        // 显示一段时间后淡出
        setTimeout(() => {
            popup.classList.remove('show');
            popup.classList.add('hide');
        }, 2500);

        // 动画结束后移除元素
        setTimeout(() => {
            popup.remove();
        }, 1750);
    }

    // 渲染成功汉字（偏旁红色，主体蓝色）
    // 渲染成功汉字（偏旁红色，主体蓝色）
    renderSuccessHanzi(character, targetId) {
        const writer = HanziWriter.create(targetId, character, {
            width: 200,
            height: 200,
            padding: 10,
            strokeColor: '#1E90FF', // 蓝色主体
            radicalColor: '#FF0000', // 偏旁红色
            delayBetweenStrokes: 300,
            strokeAnimationSpeed: 1,
            showCharacter: true, // 显示汉字
            showOutline: false // 不显示轮廓
        });

        // 直接显示汉字，不播放写字动画
        writer.showCharacter({
            onComplete: () => {
                console.log(`成功汉字 ${character} 直接显示完成`);
            }
        });
    }
    // 新增方法：朗读拼音
    // 更完善的拼音朗读方法
    // 改进版本：检查可用的语音并选择最佳的
    speakPinyin(letter) {
        const pinyin = this.pinyinData[letter] || letter;

        if (this.speechSynthesis) {
            this.speechSynthesis.cancel();
        }

        // 获取可用的中文语音
        const voices = this.speechSynthesis.getVoices();
        const chineseVoices = voices.filter(voice =>
            voice.lang.includes('zh') || voice.lang.includes('CN')
        );

        const utterance = new SpeechSynthesisUtterance(letter);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.6;
        utterance.pitch = 1;
        utterance.volume = 1;

        // 如果有中文语音，优先使用
        if (chineseVoices.length > 0) {
            utterance.voice = chineseVoices[0]; // 使用第一个中文语音
            console.log(`使用中文语音: ${chineseVoices[0].name}`);
        }

        console.log(`朗读汉字: ${letter} (拼音: ${pinyin})`);

        if (this.speechSynthesis) {
            this.speechSynthesis.speak(utterance);
        }
    }



    async recordLevelToServer() {
        try {
            const response = await fetch('http://localhost:3000/write', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({}) // 可传递额外数据
            });

            const result = await response.json();
            if (result.success) {
                console.log('数据写入成功');
            } else {
                console.error('数据写入失败:', result.message);
            }
        } catch (error) {
            console.error('请求失败:', error);
        }
    }



    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }


    addHanziToDisplay(letter) {
        // 创建汉字展示项
        const hanziItem = document.createElement('div');
        hanziItem.className = 'hanzi-item';

        // 创建汉字容器
        const hanziCharDiv = document.createElement('div');
        hanziCharDiv.className = 'hanzi-character';
        hanziCharDiv.id = `hanzi-${letter}`;

        // 创建标签
        const hanziLabel = document.createElement('div');
        hanziLabel.className = 'hanzi-label';
        //hanziLabel.textContent = letter;
        hanziLabel.textContent = ''; // 不显示汉字
        hanziLabel.style.display = 'none'; // 完全隐藏

        // 添加拼音显示
        const pinyinDiv = document.createElement('div');
        pinyinDiv.className = 'hanzi-pinyin';
        pinyinDiv.textContent = this.pinyinData[letter] || '';


        hanziItem.appendChild(hanziCharDiv);
        hanziItem.appendChild(hanziLabel);
        hanziItem.appendChild(pinyinDiv); // 添加拼音
        // 使用 prepend 方法将新元素插入到最前面（实现倒序）
        this.hanziGrid.prepend(hanziItem);

        // 使用 hanzi-writer 渲染汉字
        this.renderHanziWithWriterSmall(letter, hanziCharDiv.id);
    }

    // 新增方法：缩小版汉字渲染
    renderHanziWithWriterSmall(character, targetId) {
        // 根据汉字确定偏旁颜色配置
        const radicalConfig = this.getRadicalColorConfig(character);

        // 创建 hanzi-writer 实例（缩小尺寸）
        const writer = HanziWriter.create(targetId, character, {
            width: 50,  // 设置为50
            height: 50, // 设置为50
            padding: 2, // 相应减少内边距
            strokeColor: '#1E90FF', // 蓝色主体
            radicalColor: '#FF0000', // 偏旁红色
            delayBetweenStrokes: 150, // 进一步缩短延迟
            strokeAnimationSpeed: 1
        });

        // 播放动画
        setTimeout(() => {
            writer.animateCharacter({
                onComplete: () => {
                    console.log(`汉字 ${character} 小尺寸动画完成`);
                }
            });
        }, 300); // 缩短延迟时间
    }

    renderHanziWithWriter(character, targetId) {
        // 根据汉字确定偏旁颜色配置
        const radicalConfig = this.getRadicalColorConfig(character);

        // 创建 hanzi-writer 实例
        const writer = HanziWriter.create(targetId, character, {
            width: 100,
            height: 100,
            padding: 5,
            strokeColor: '#1E90FF', // 蓝色主体
            radicalColor:  '#FF0000', // 偏旁红色.
            delayBetweenStrokes: 300,
            strokeAnimationSpeed: 1
        });

        // 播放动画
        setTimeout(() => {
            writer.animateCharacter({
                onComplete: () => {
                    console.log(`汉字 ${character} 动画完成`);
                }
            });
        }, 500);
    }

    getRadicalColorConfig(character) {
        // 定义常见偏旁及其颜色配置
        const radicalMap = {
            // 艹字头 - 绿色
            '艹': { color: '#FF0000', position: 'top' },
            // 氵 - 蓝色水
            '氵': { color: '#FF0000', position: 'left' },
            // 冫 - 冰字旁
            '冫': { color: '#FF0000', position: 'left' },
            // 灬 - 四点底
            '灬': { color: '#FF0000', position: 'bottom' },
            // 鸟 - 鸟字旁
            '鸟': { color: '#FF0000', position: 'right' },
            // 心 - 心字底
            '心': { color: '#FF0000', position: 'bottom' },
            // 木 - 木字旁
            '木': { color: '#FF0000', position: 'left' },
            // 山 - 山字旁
            '山': { color: '#FF0000', position: 'left' }
        };

        // 根据字符查找对应的偏旁配置
        const wordData = this.wordsData.find(word => word.letter === character);
        if (wordData) {
            const parts = wordData.letterSplit.split(' ');
            for (let part of parts) {
                if (radicalMap[part]) {
                    return radicalMap[part];
                }
            }
        }

        // 默认配置
        return { color: '#FF0000' };
    }

    // 在类的末尾添加这些方法

    showLianxiArea() {
        // 切换到练习卡片
        this.switchToCard('lianxiContainer');

        // 添加事件监听器
        document.getElementById('startLianxiBtn').addEventListener('click', () => {
            this.startLianxi();
        });

        document.getElementById('nextLianxiBtn').addEventListener('click', () => {
            this.nextLianxi();
        });
    }

    startLianxi() {
        this.currentLianxiIndex = 0;
        this.lianxiGrid.innerHTML = '';
        document.getElementById('startLianxiBtn').style.display = 'none';
        document.getElementById('nextLianxiBtn').style.display = 'inline-block';

        this.showNextLianxiCharacter();
        // 开始时朗读第一个汉字
        this.speakCurrentCharacter();
    }
    // 根据当前课程初始化练习
    initLianxiWithCurrentLesson() {
        // 重置练习索引
        this.currentLianxiIndex = 0;

        // 如果有当前课程，只使用该课程的汉字
        if (this.currentLesson) {
            const lessonWords = this.wordsData.filter(word => word.kecheng === this.currentLesson);
            // 临时替换 wordsData 用于练习
            this.originalWordsData = this.wordsData; // 保存原始数据
            // 注意：这里不直接替换，而是在显示时过滤
        }
    }

    nextLianxi() {
        this.currentLianxiIndex++;

        // 检查是否超过当前课程的汉字数量
        const totalChars = this.currentLesson ?
            this.wordsData.filter(word => word.kecheng === this.currentLesson).length :
            this.wordsData.length;

        if (this.currentLianxiIndex >= totalChars) {
            alert('练习完成！');
            this.resetLianxi();
            return;
        }

        this.showNextLianxiCharacter();
        // 点击下一个时朗读当前汉字
        this.speakCurrentCharacter();
    }

    // 新增方法：朗读当前汉字
    speakCurrentCharacter() {
        // 根据当前课程获取汉字
        let currentWord;
        if (this.currentLesson) {
            const lessonWords = this.wordsData.filter(word => word.kecheng === this.currentLesson);
            if (this.currentLianxiIndex < lessonWords.length) {
                currentWord = lessonWords[this.currentLianxiIndex];
            } else {
                return;
            }
        } else {
            if (this.currentLianxiIndex < this.wordsData.length) {
                currentWord = this.wordsData[this.currentLianxiIndex];
            } else {
                return;
            }
        }

        const character = currentWord.letter;
        const pinyin = this.pinyinData[character] || character;

        // 停止当前正在播放的语音
        this.speechSynthesis.cancel();

        // 创建语音对象
        const utterance = new SpeechSynthesisUtterance(character);
        utterance.lang = 'zh-CN'; // 设置为中文
        utterance.rate = 0.5; // 语速稍慢
        utterance.pitch = 1; // 音调正常
        utterance.volume = 1; // 音量最大

        console.log(`朗读汉字：${character} (${pinyin})`);

        // 播放语音
        this.speechSynthesis.speak(utterance);
    }


    resetLianxi() {
        this.currentLianxiIndex = 0;
        this.lianxiGrid.innerHTML = '';
        document.getElementById('startLianxiBtn').style.display = 'inline-block';
        document.getElementById('nextLianxiBtn').style.display = 'none';
        document.getElementById('lianxiProgress').textContent = '';
        // 停止语音播放
        this.speechSynthesis.cancel();
    }

    // 切换卡片
    switchToCard(cardId) {
        // 移除所有按钮的 active 类
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => btn.classList.remove('active'));
        
        // 隐藏所有内容卡片
        const contents = document.querySelectorAll('.card-content');
        contents.forEach(content => content.classList.remove('active'));
        
        // 显示目标卡片
        document.getElementById(cardId).classList.add('active');
        
        // 激活对应的导航按钮
        const targetBtn = document.querySelector(`[data-target="${cardId}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }
    }


    showNextLianxiCharacter() {
        // 根据当前课程过滤汉字
        let currentWord;
        if (this.currentLesson) {
            const lessonWords = this.wordsData.filter(word => word.kecheng === this.currentLesson);
            if (this.currentLianxiIndex < lessonWords.length) {
                currentWord = lessonWords[this.currentLianxiIndex];
            } else {
                // 练习完成
                alert('练习完成！');
                this.resetLianxi();
                return;
            }
        } else {
            if (this.currentLianxiIndex >= this.wordsData.length) {
                alert('练习完成！');
                this.resetLianxi();
                return;
            }
            currentWord = this.wordsData[this.currentLianxiIndex];
        }

        const modes = [ 'radical', 'main'];
        this.lianxiMode = modes[Math.floor(Math.random() * modes.length)];

        // 更新进度显示
        const totalChars = this.currentLesson ?
            this.wordsData.filter(word => word.kecheng === this.currentLesson).length :
            this.wordsData.length;

        document.getElementById('lianxiProgress').textContent =
            `进度：${this.currentLianxiIndex + 1}/${totalChars}`;

        // 创建练习项
        const lianxiItem = document.createElement('div');
        lianxiItem.className = 'lianxi-item';

        const lianxiCharDiv = document.createElement('div');
        lianxiCharDiv.className = 'lianxi-character';
        lianxiCharDiv.id = `lianxi-${currentWord.letter}-${Date.now()}`;

        const lianxiLabel = document.createElement('div');
        lianxiLabel.className = 'lianxi-label';
        //lianxiLabel.textContent = currentWord.letter;
        lianxiLabel.textContent = ''; // 不显示汉字
        lianxiLabel.style.display = 'none'; // 完全隐藏

        // 添加拼音显示
        const pinyinDiv = document.createElement('div');
        pinyinDiv.className = 'lianxi-pinyin';
        pinyinDiv.textContent = this.pinyinData[currentWord.letter] || '';
        pinyinDiv.style.fontSize = '24px'; // 放大拼音显示
        pinyinDiv.style.fontWeight = 'bold';
        pinyinDiv.style.color = '#333';

        const modeIndicator = document.createElement('div');
        modeIndicator.className = 'lianxi-mode-indicator';
        modeIndicator.textContent = this.getModeText(this.lianxiMode);

        lianxiItem.appendChild(lianxiCharDiv);
        lianxiItem.appendChild(lianxiLabel);
        lianxiItem.appendChild(pinyinDiv); // 添加拼音
        lianxiItem.appendChild(modeIndicator);
        this.lianxiGrid.appendChild(lianxiItem);

        // 渲染汉字
        this.renderLianxiHanziDirect(currentWord.letter, lianxiCharDiv.id);
    }

    getModeText(mode) {
        switch(mode) {
            /*case 'both': return '完整绘制';*/
            case 'radical': return '仅绘偏旁';
            case 'main': return '仅绘主体';
            default: return '';
        }
    }

    // 删除原来的 renderLianxiHanzi 方法，替换为：

renderLianxiHanziDirect(character, targetId) {
    // 获取偏旁信息
    const radicalInfo = this.getRadicalStrokeInfo(character);

    let strokeColor, radicalColor;

    switch(this.lianxiMode) {
        case 'radical':
            strokeColor = '#FFFFFF'; // 白色主体
            radicalColor = '#FF0000'; // 红色偏旁
            break;
        case 'main':
            strokeColor = '#1E90FF'; // 蓝色主体
            radicalColor = '#FFFFFF'; // 白色偏旁
            break;
    }

    // 创建 hanzi-writer 实例
    const writer = HanziWriter.create(targetId, character, {
        width: 100,
        height: 100,
        padding: 5,
        strokeColor: strokeColor,
        radicalColor: radicalColor,
        showCharacter: true,
        showOutline: false
    });

    // 直接显示汉字，不播放动画
    console.log(`练习汉字 ${character} (${this.lianxiMode}模式) 直接绘制完成`);
}


    getRadicalStrokeInfo(character) {
        // 定义汉字的偏旁笔画信息
        const radicalStrokeMap = {
            '芽': { radicalParts: ['艹'], strokeIndices: [0, 1, 2] },
            '梅': { radicalParts: ['木'], strokeIndices: [0, 1, 2, 3] },
            '泛': { radicalParts: ['氵'], strokeIndices: [0, 1, 2] },
            '减': { radicalParts: ['冫'], strokeIndices: [0, 1] },
            '融': { radicalParts: ['虫'], strokeIndices: [6, 7, 8, 9, 10, 11] },
            '燕': { radicalParts: ['灬'], strokeIndices: [12, 13, 14, 15] },
            '鸳': { radicalParts: ['鸟'], strokeIndices: [7, 8, 9, 10, 11] },
            '鸯': { radicalParts: ['鸟'], strokeIndices: [8, 9, 10, 11, 12] },
            '惠': { radicalParts: ['心'], strokeIndices: [9, 10, 11, 12] },
            '崇': { radicalParts: ['山'], strokeIndices: [0, 1, 2] }
        };

        return radicalStrokeMap[character] || { radicalParts: [], strokeIndices: [] };
    }


}

// 启动游戏
new WordMatchGame();
