const CONFIG = {
    MAP_WIDTH: 15, // Smaller for mobile screen
    MAP_HEIGHT: 15,
    MAX_AIR: 180,
    BASE_HP: 100,
    ENEMY_COUNT: 4,
    CHEST_COUNT: 4
};

const DIRS = [
    { x: 0, y: -1, name: 'up' },
    { x: 1, y: 0, name: 'right' },
    { x: 0, y: 1, name: 'down' },
    { x: -1, y: 0, name: 'left' }
];

const RARITY = {
    BRONZE: { name: '銅', color: 'bronze', prob: 60, words: ['fish', 'sea', 'wet', 'crab'] },
    SILVER: { name: '銀', color: 'silver', prob: 30, words: ['ocean', 'squid', 'bubble'] },
    GOLD: { name: '金', color: 'gold', prob: 10, words: ['leviathan', 'treasure', 'abyss'] }
};

const EQUIP_TYPES = ['weapon', 'head', 'body', 'arms'];

const SKILLS = [
    { id: 'slash', name: '渾身の一撃', cost: 10, type: 'attack', mult: 2.0, price: 50, desc: '酸素を10消費し、2倍のダメージ' },
    { id: 'heal', name: '応急処置', cost: 15, type: 'heal', power: 30, price: 80, desc: '酸素を15消費し、HPを30回復' },
    { id: 'pierce', name: '甲羅割り', cost: 8, type: 'attack_pierce', mult: 1.2, price: 100, desc: '酸素を8消費し、敵の防御力を無視' }
];

const ENEMIES = [
    { id: 'fish', name: '凶暴な魚', baseHp: 20, atk: 5, def: 2, img: 'enemy_fish.png', prob: 50 },
    { id: 'crab', name: '鎧ガニ', baseHp: 30, atk: 4, def: 8, img: 'enemy_crab.png', prob: 30 },
    { id: 'squid', name: '深淵のイカ', baseHp: 20, atk: 12, def: 1, img: 'enemy_squid.png', prob: 15 },
    { id: 'shark', name: '暴君ザメ', baseHp: 60, atk: 15, def: 5, img: 'enemy_shark.png', prob: 5 }
];


class Game {
    constructor() {
        this.player = {
            x: 1, y: 1,
            hp: CONFIG.BASE_HP, maxHp: CONFIG.BASE_HP,
            air: CONFIG.MAX_AIR, maxAir: CONFIG.MAX_AIR,
            atk: 10, def: 5, luk: 5,
            inventory: [],
            equipmentInventory: [],
            equipment: { weapon: null, head: null, body: null, arms: null },
            coins: 0,
            stats: { kills: 0, chestsOpened: 0, dismantles: 0 },
            quests: [],
            skills: []
        };
        this.map = [];
        this.entities = [];
        this.isDiving = false;
        
        this.initDOM();
        this.bindEvents();
        this.generateQuests();
        this.updateUI();
    }

    initDOM() {
        this.dom = {
            hpBar: document.getElementById('hp-bar'),
            hpValue: document.getElementById('hp-value'),
            airContainer: document.getElementById('air-container'),
            airBar: document.getElementById('air-bar'),
            airValue: document.getElementById('air-value'),
            coinValue: document.getElementById('coin-value'),
            
            statAtkBase: document.getElementById('stat-atk-base'),
            statAtkBonus: document.getElementById('stat-atk-bonus'),
            statDefBase: document.getElementById('stat-def-base'),
            statDefBonus: document.getElementById('stat-def-bonus'),
            statLukBase: document.getElementById('stat-luk-base'),
            statLukBonus: document.getElementById('stat-luk-bonus'),
            equipmentList: document.getElementById('equipment-inventory'),
            chestList: document.getElementById('chest-inventory'),
            
            avatarBody: document.getElementById('avatar-body'),
            avatarHead: document.getElementById('avatar-head'),
            avatarArms: document.getElementById('avatar-arms'),
            avatarWeapon: document.getElementById('avatar-weapon'),
            
            btnInn: document.getElementById('btn-inn'),
            blacksmithList: document.getElementById('blacksmith-inventory'),
            questList: document.getElementById('quest-list'),
            dojoList: document.getElementById('dojo-list'),
            
            navBtns: document.querySelectorAll('.nav-btn'),
            views: document.querySelectorAll('.view'),
            
            startOverlay: document.getElementById('start-overlay'),
            mapArea: document.getElementById('map-area'),
            mapGrid: document.getElementById('game-map'),
            logList: document.getElementById('message-log'),
            
            btnStartDive: document.getElementById('btn-start-dive'),
            btnRest: document.getElementById('btn-rest'),
            
            dpadBtns: document.querySelectorAll('.dpad-btn'),
            
            combatEnemyHp: document.getElementById('combat-enemy-hp'),
            combatEnemyName: document.getElementById('combat-enemy-name'),
            combatEnemyImg: document.getElementById('combat-enemy-img'),
            combatLog: document.getElementById('combat-log'),
            combatSkillsArea: document.getElementById('combat-skills-area'),
            btnAttack: document.getElementById('btn-attack'),
            btnDefend: document.getElementById('btn-defend'),
            btnFlee: document.getElementById('btn-flee'),
            
            encounterOverlay: document.getElementById('encounter-overlay'),
            
            typingModal: document.getElementById('typing-modal'),
            typingTarget: document.getElementById('typing-target'),
            typingInput: document.getElementById('typing-input'),
            typingInfo: document.getElementById('typing-chest-info'),
            typingBar: document.getElementById('typing-bar'),
            
            gameoverModal: document.getElementById('gameover-modal'),
            gameoverMsg: document.getElementById('gameover-msg'),
            btnRetry: document.getElementById('btn-retry')
        };
        
        this.dom.mapGrid.style.gridTemplateColumns = `repeat(${CONFIG.MAP_WIDTH}, 1fr)`;
        this.dom.mapGrid.style.gridTemplateRows = `repeat(${CONFIG.MAP_HEIGHT}, 1fr)`;
    }

    bindEvents() {
        // Tab Navigation
        this.dom.navBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (this.isDiving || this.state === 'COMBAT' || this.state === 'TRANSITION' || this.state === 'TYPING') {
                    this.showNotification("移動不可", "探索中は他の画面を開けません！\nまずは生還するか、敵を倒してください。", "🚫");
                    return;
                }
                const targetId = e.currentTarget.dataset.target;
                this.switchTab(targetId);
            });
        });

        // Start Dive
        document.getElementById('btn-start-dive').addEventListener('click', () => this.startDive());
        this.dom.btnInn.addEventListener('click', () => this.innRest());
        document.getElementById('btn-retry').addEventListener('click', () => this.resetGame());
        
        // D-pad Input
        this.dom.dpadBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dirName = e.currentTarget.dataset.dir;
                this.move(dirName);
            });
        });

        // Keyboard support (for testing)
        document.addEventListener('keydown', (e) => {
            if (!this.isDiving || this.state === 'COMBAT' || this.state === 'TYPING') return;
            if (e.key === 'ArrowUp' || e.key === 'w') this.move('up');
            if (e.key === 'ArrowDown' || e.key === 's') this.move('down');
            if (e.key === 'ArrowLeft' || e.key === 'a') this.move('left');
            if (e.key === 'ArrowRight' || e.key === 'd') this.move('right');
        });

        // Combat
        this.dom.btnAttack.addEventListener('click', () => this.combatAction('attack'));
        this.dom.btnDefend.addEventListener('click', () => this.combatAction('defend'));
        if(this.dom.btnFlee) this.dom.btnFlee.addEventListener('click', () => this.combatAction('flee'));

        // Typing
        this.dom.typingInput.addEventListener('input', (e) => this.handleTyping(e));
    }

    switchTab(targetId) {
        // Update nav buttons
        this.dom.navBtns.forEach(btn => {
            if (btn.dataset.target === targetId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        // Update views
        this.dom.views.forEach(view => {
            if (view.id === targetId) view.classList.add('active');
            else view.classList.remove('active');
        });
        
        this.updateUI();
    }

    updateUI() {
        this.dom.hpValue.textContent = this.player.hp;
        this.dom.hpBar.style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        
        if (this.isDiving) {
            this.dom.airContainer.style.visibility = 'visible';
            this.dom.airValue.textContent = this.player.air;
            this.dom.airBar.style.width = `${(this.player.air / this.player.maxAir) * 100}%`;
        } else {
            this.dom.airContainer.style.visibility = 'hidden';
        }
        
        let bonusAtk = 0, bonusDef = 0, bonusLuk = 0;
        EQUIP_TYPES.forEach(type => {
            if (this.player.equipment[type]) {
                bonusAtk += this.player.equipment[type].atk;
                bonusDef += this.player.equipment[type].def;
                bonusLuk += this.player.equipment[type].luk;
            }
        });
        
        let baseAtk = 10, baseDef = 5, baseLuk = 5;
        this.player.atk = baseAtk + bonusAtk;
        this.player.def = baseDef + bonusDef;
        this.player.luk = baseLuk + bonusLuk;

        this.dom.statAtkBase.textContent = baseAtk;
        this.dom.statAtkBonus.textContent = bonusAtk > 0 ? `+ ${bonusAtk}` : '';
        this.dom.statDefBase.textContent = baseDef;
        this.dom.statDefBonus.textContent = bonusDef > 0 ? `+ ${bonusDef}` : '';
        this.dom.statLukBase.textContent = baseLuk;
        this.dom.statLukBonus.textContent = bonusLuk > 0 ? `+ ${bonusLuk}` : '';

        // Inventory
        this.dom.chestList.innerHTML = '';
        if (this.player.inventory.length === 0) {
            this.dom.chestList.innerHTML = '<p class="empty-text">まだ宝箱はありません</p>';
        } else {
            this.player.inventory.forEach((chest, index) => {
                const div = document.createElement('div');
                div.className = `chest-item ${chest.rarity.color}`;
                div.innerHTML = `
                    <div style="flex-grow:1; display:flex; align-items:center; gap:10px;">
                        <span><img src="chest.png" style="width:24px; height:24px; object-fit:contain; filter:drop-shadow(0 0 5px rgba(0,0,0,0.5));"></span><span>${chest.rarity.name}の宝箱</span>
                    </div>
                    <button class="btn info open-btn" data-index="${index}" style="padding: 6px 12px; font-size: 0.9rem;">開ける</button>
                `;
                this.dom.chestList.appendChild(div);
            });
            
            this.dom.chestList.querySelectorAll('.open-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index, 10);
                    this.startSingleTyping(idx);
                });
            });
        }
        
        // Equipment
        EQUIP_TYPES.forEach(type => {
            const el = document.getElementById(`equip-${type}`).querySelector('.item-name');
            const item = this.player.equipment[type];
            el.textContent = item ? item.name : '-';
            
            // Update Avatar
            const avatarMap = {
                weapon: { el: this.dom.avatarWeapon, icon: '🗡️' },
                head: { el: this.dom.avatarHead, icon: '⛑️' },
                body: { el: this.dom.avatarBody, icon: '👕' },
                arms: { el: this.dom.avatarArms, icon: '🛡️' }
            };
            const av = avatarMap[type];
            if (item) {
                av.el.className = `doll-layer equip-layer ${type}-layer equipped item-${item.rarity}`;
                av.el.textContent = av.icon;
            } else {
                av.el.className = `doll-layer equip-layer ${type}-layer`;
                av.el.textContent = '';
            }
        });

        // Equipment Inventory
        this.dom.equipmentList.innerHTML = '';
        this.dom.blacksmithList.innerHTML = '';
        
        if (this.player.equipmentInventory.length === 0) {
            this.dom.equipmentList.innerHTML = '<p class="empty-text">所持装備なし</p>';
            this.dom.blacksmithList.innerHTML = '<p class="empty-text">分解できる装備がありません</p>';
        } else {
            this.player.equipmentInventory.forEach((item, index) => {
                // Equip Tab
                const btn = document.createElement('div');
                btn.className = `equip-item-btn ${item.rarity}`;
                btn.innerHTML = `
                    <div class="item-type">${item.type === 'weapon' ? '武器' : item.type === 'head' ? '頭' : item.type === 'body' ? '胴' : '腕'}</div>
                    <div style="font-weight: bold; font-size: 0.9rem;">${item.name}</div>
                    <div class="item-stats">ATK+${item.atk} DEF+${item.def} LUK+${item.luk}</div>
                `;
                btn.addEventListener('click', () => this.equipManualItem(index));
                this.dom.equipmentList.appendChild(btn);

                // Blacksmith Tab
                const bBtn = document.createElement('div');
                bBtn.className = `chest-item ${item.rarity === 'gold' ? 'gold' : (item.rarity === 'silver' ? 'silver' : 'bronze')}`;
                bBtn.innerHTML = `
                    <div style="flex-grow:1;">
                        <span style="font-weight:bold;">${item.name}</span>
                        <span style="font-size:0.8rem; color:gray; margin-left:10px;">分解で ${item.rarity === 'gold' ? 30 : (item.rarity === 'silver' ? 15 : 5)}🪙</span>
                    </div>
                    <button class="btn danger" style="padding: 4px 10px; font-size: 0.8rem;" data-index="${index}">分解</button>
                `;
                bBtn.querySelector('button').addEventListener('click', (e) => {
                    this.dismantleEquipment(parseInt(e.currentTarget.dataset.index, 10));
                });
                this.dom.blacksmithList.appendChild(bBtn);
            });
        }
        
        // Quests
        this.dom.questList.innerHTML = '';
        if (this.player.quests.length === 0) {
            this.dom.questList.innerHTML = '<p class="empty-text">現在依頼はありません</p>';
        } else {
            this.player.quests.forEach((q, idx) => {
                const div = document.createElement('div');
                div.className = "chest-item";
                div.style.flexDirection = "column";
                div.style.alignItems = "stretch";
                const isComplete = q.progress >= q.target;
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold;">${q.name}</span>
                        <span style="color:gold;">${q.reward}🪙</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:5px;">
                        <span style="font-size:0.8rem;">進捗: ${q.progress} / ${q.target}</span>
                        ${isComplete ? `<button class="btn primary" style="padding: 4px 10px; font-size:0.8rem;">報告</button>` : `<button class="btn" style="padding: 4px 10px; font-size:0.8rem; opacity:0.5;" disabled>未達成</button>`}
                    </div>
                `;
                if(isComplete) {
                    div.querySelector('.btn.primary').addEventListener('click', () => this.claimQuest(idx));
                }
                this.dom.questList.appendChild(div);
            });
        }
        
        // Coin
        this.dom.coinValue.textContent = this.player.coins;
        
        // Update Dojo
        if(this.dom.dojoList) {
            this.dom.dojoList.innerHTML = '';
            SKILLS.forEach(skill => {
                const hasSkill = this.player.skills.includes(skill.id);
                const div = document.createElement('div');
                div.className = "chest-item";
                div.style.flexDirection = "column";
                div.style.alignItems = "stretch";
                div.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="font-weight:bold; color:var(--start-color);">${skill.name}</span>
                        <span style="color:var(--color-air); font-size:0.8rem;">🫧 ${skill.cost}</span>
                    </div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin: 5px 0;">${skill.desc}</div>
                    <div style="text-align: right;">
                        ${hasSkill 
                            ? `<span style="font-size:0.8rem; color:gray;">習得済み</span>` 
                            : `<button class="btn info learn-btn" data-id="${skill.id}" style="padding: 4px 10px; font-size:0.8rem;">${skill.price}🪙 習得</button>`}
                    </div>
                `;
                if(!hasSkill) {
                    div.querySelector('.learn-btn').addEventListener('click', (e) => this.learnSkill(e.currentTarget.dataset.id));
                }
                this.dom.dojoList.appendChild(div);
            });
        }
        
        // Update Combat Skills
        if(this.dom.combatSkillsArea && this.state === 'COMBAT') {
            this.dom.combatSkillsArea.innerHTML = '';
            if (this.player.skills.length > 0) {
                this.player.skills.forEach(skillId => {
                    const skill = SKILLS.find(s => s.id === skillId);
                    const btn = document.createElement('button');
                    btn.className = "skill-btn";
                    btn.innerHTML = `<span>${skill.name}</span><span class="skill-cost">🫧${skill.cost}</span>`;
                    btn.addEventListener('click', () => this.combatAction('skill', skill));
                    
                    if (this.player.air < skill.cost) btn.disabled = true;
                    
                    this.dom.combatSkillsArea.appendChild(btn);
                });
            }
        }
    }

    learnSkill(id) {
        const skill = SKILLS.find(s => s.id === id);
        if (this.player.coins >= skill.price) {
            this.player.coins -= skill.price;
            this.player.skills.push(id);
            this.showNotification("習得！", `${skill.name}を習得した！`, "🥋");
            this.updateUI();
        } else {
            this.showNotification("エラー", "コインが足りません！", "🪙");
        }
    }

    innRest() {
        if (this.player.hp >= this.player.maxHp) {
            this.showNotification("エラー", "HPは既に満タンです！", "🛏️");
            return;
        }
        if (this.player.coins >= 10) {
            this.player.coins -= 10;
            this.player.hp = this.player.maxHp;
            this.showNotification("回復！", "10コイン支払い、宿屋でぐっすり休んだ！\nHPが全回復しました。", "💤");
            this.updateUI();
        } else {
            this.showNotification("エラー", "コインが足りません！", "🪙");
        }
    }

    dismantleEquipment(index) {
        const item = this.player.equipmentInventory[index];
        const coins = item.rarity === 'gold' ? 30 : (item.rarity === 'silver' ? 15 : 5);
        this.showConfirm("分解の確認", `${item.name} を分解して ${coins} コインにしますか？\n（この操作は取り消せません）`, "🔨", () => {
            this.player.equipmentInventory.splice(index, 1);
            this.player.coins += coins;
            this.updateStats('dismantles');
            this.updateUI();
        });
    }

    generateQuests() {
        const questTypes = [
            { id: 'kills', name: '敵を討伐する', maxTarget: 5, rewardMult: 10 },
            { id: 'chestsOpened', name: '宝箱を解錠する', maxTarget: 3, rewardMult: 15 },
            { id: 'dismantles', name: '装備を分解する', maxTarget: 5, rewardMult: 5 }
        ];
        
        while(this.player.quests.length < 3) {
            const q = questTypes[Math.floor(Math.random() * questTypes.length)];
            const target = Math.floor(Math.random() * q.maxTarget) + 1;
            this.player.quests.push({
                id: q.id,
                name: q.name,
                target: target,
                progress: 0,
                reward: target * q.rewardMult
            });
        }
    }

    updateStats(type, amount=1) {
        if(this.player.stats[type] === undefined) this.player.stats[type] = 0;
        this.player.stats[type] += amount;
        
        let questCompleted = false;
        this.player.quests.forEach(q => {
            if (q.id === type && q.progress < q.target) {
                q.progress += amount;
                if (q.progress >= q.target) {
                    questCompleted = true;
                }
            }
        });
        if(questCompleted) this.updateUI();
    }

    claimQuest(index) {
        const q = this.player.quests[index];
        if (q.progress >= q.target) {
            this.player.coins += q.reward;
            this.player.quests.splice(index, 1);
            this.showNotification("達成！", `依頼達成！\n報酬として ${q.reward} コインを獲得しました！`, "💰");
            this.generateQuests();
            this.updateUI();
        }
    }

    log(message, type = 'normal') {
        const p = document.createElement('p');
        p.textContent = message;
        p.className = type;
        this.dom.logList.appendChild(p);
        this.dom.logList.scrollTop = this.dom.logList.scrollHeight;
    }

    startDive() {
        this.isDiving = true;
        this.state = 'EXPLORE';
        this.dom.startOverlay.classList.remove('active');
        this.dom.mapArea.classList.remove('hidden');
        
        this.player.air = this.player.maxAir;
        this.entities = [];
        this.dom.logList.innerHTML = '';
        this.log('潜水を開始した！', 'important');
        
        this.generateMap();
        this.player.x = 1;
        this.player.y = 1;
        this.renderMap();
        this.updateUI();
    }

    endDive() {
        this.isDiving = false;
        this.dom.startOverlay.classList.add('active');
        this.dom.mapArea.classList.add('hidden');
        this.updateUI();
    }

    generateMap() {
        this.map = Array(CONFIG.MAP_HEIGHT).fill(0).map(() => Array(CONFIG.MAP_WIDTH).fill(1));
        const carve = (x, y) => {
            this.map[y][x] = 0;
            const dirs = [...DIRS].sort(() => Math.random() - 0.5);
            for (let d of dirs) {
                const nx = x + d.x * 2;
                const ny = y + d.y * 2;
                if (nx > 0 && nx < CONFIG.MAP_WIDTH - 1 && ny > 0 && ny < CONFIG.MAP_HEIGHT - 1 && this.map[ny][nx] === 1) {
                    this.map[y + d.y][x + d.x] = 0;
                    carve(nx, ny);
                }
            }
        };
        carve(1, 1);
        
        this.placeEntities('chest', CONFIG.CHEST_COUNT);
        this.placeEntities('enemy', CONFIG.ENEMY_COUNT);
    }

    placeEntities(type, count) {
        let placed = 0;
        while (placed < count) {
            const x = Math.floor(Math.random() * (CONFIG.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (CONFIG.MAP_HEIGHT - 2)) + 1;
            if (this.map[y][x] === 0 && !(x === 1 && y === 1) && !this.getEntityAt(x, y)) {
                this.entities.push({ type, x, y });
                placed++;
            }
        }
    }

    getEntityAt(x, y) { return this.entities.find(e => e.x === x && e.y === y); }
    removeEntity(entity) { this.entities = this.entities.filter(e => e !== entity); }

    renderMap() {
        this.dom.mapGrid.innerHTML = '';
        for (let y = 0; y < CONFIG.MAP_HEIGHT; y++) {
            for (let x = 0; x < CONFIG.MAP_WIDTH; x++) {
                const cell = document.createElement('div');
                cell.className = `cell ${this.map[y][x] === 1 ? 'wall' : 'floor'}`;
                
                const dist = Math.abs(this.player.x - x) + Math.abs(this.player.y - y);
                if (dist <= 3) cell.classList.add('explored');
                else cell.classList.add('unexplored');

                if (x === 1 && y === 1) {
                    cell.classList.add('start');
                    if (dist <= 3) cell.innerHTML = '⬆️';
                }

                if (x === this.player.x && y === this.player.y) {
                    cell.innerHTML = '<div class="player">🦦</div>';
                } else if (dist <= 3) {
                    const entity = this.getEntityAt(x, y);
                    if (entity) cell.innerHTML = entity.type === 'chest' ? '📦' : '🐟';
                }
                
                this.dom.mapGrid.appendChild(cell);
            }
        }
    }

    move(dirName) {
        if (!this.isDiving || this.state !== 'EXPLORE') return;
        
        const d = DIRS.find(dir => dir.name === dirName);
        if (!d) return;

        const nx = this.player.x + d.x;
        const ny = this.player.y + d.y;

        if (this.map[ny] && this.map[ny][nx] === 0) {
            this.player.x = nx;
            this.player.y = ny;
            this.player.air -= 1;
            
            this.checkTile();
            this.renderMap();
            this.updateUI();
            this.checkAir();
        }
    }

    checkTile() {
        if (this.player.x === 1 && this.player.y === 1 && this.player.inventory.length > 0) {
            this.log('無事に生還した！宝箱画面から解錠しよう！', 'success');
            setTimeout(() => {
                this.showNotification("生還した！", "「宝箱」タブから持ち帰った宝箱を開けよう！", "🦦", () => {
                    this.endDive();
                });
            }, 100);
            return;
        }

        const entity = this.getEntityAt(this.player.x, this.player.y);
        if (entity) {
            if (entity.type === 'chest') {
                this.getChest();
                this.removeEntity(entity);
            } else if (entity.type === 'enemy') {
                this.startCombat(entity);
            }
        }
    }

    checkAir() {
        if (this.player.air <= 0 && (this.player.x !== 1 || this.player.y !== 1)) {
            this.triggerGameOver('酸素が尽きた... 獲得した宝箱を失った');
        }
    }

    getChest() {
        const roll = Math.random() * 100;
        const goldThreshold = RARITY.GOLD.prob + (this.player.luk * 0.5);
        const silverThreshold = goldThreshold + RARITY.SILVER.prob + (this.player.luk * 0.5);
        
        let rarity;
        if (roll < goldThreshold) rarity = RARITY.GOLD;
        else if (roll < silverThreshold) rarity = RARITY.SILVER;
        else rarity = RARITY.BRONZE;

        this.player.inventory.push({ rarity });
        this.log(`${rarity.name}箱を入手！`, 'success');
    }

    startCombat(enemyEntity) {
        this.state = 'TRANSITION';
        this.isDiving = false; // Prevent movement
        
        // Select enemy based on prob
        const roll = Math.random() * 100;
        let cumulative = 0;
        let selectedEnemy = ENEMIES[0];
        for (let e of ENEMIES) {
            cumulative += e.prob;
            if (roll < cumulative) {
                selectedEnemy = e;
                break;
            }
        }

        this.currentEnemy = {
            entity: enemyEntity,
            data: selectedEnemy,
            hp: selectedEnemy.baseHp + Math.floor(Math.random() * 10),
            atk: selectedEnemy.atk + Math.floor(Math.random() * 3),
            def: selectedEnemy.def
        };
        
        // Encounter effect
        if(this.dom.encounterOverlay) {
            this.dom.encounterOverlay.classList.remove('hidden');
            this.dom.encounterOverlay.classList.add('flash');
        }
        
        // Vibrate if mobile
        if (navigator.vibrate) navigator.vibrate(200);

        setTimeout(() => {
            if(this.dom.encounterOverlay) {
                this.dom.encounterOverlay.classList.remove('flash');
                this.dom.encounterOverlay.classList.add('hidden');
            }
            
            this.state = 'COMBAT';
            this.dom.combatLog.innerHTML = '';
            this.logCombat(`${this.currentEnemy.data.name}が現れた！`);
            
            if(this.dom.combatEnemyName) this.dom.combatEnemyName.textContent = this.currentEnemy.data.name;
            if(this.dom.combatEnemyImg) this.dom.combatEnemyImg.src = this.currentEnemy.data.img;
            
            this.updateCombatUI();
            this.switchTab('view-combat');
        }, 1500);
    }

    updateCombatUI() {
        if(this.dom.combatEnemyHp) this.dom.combatEnemyHp.textContent = this.currentEnemy.hp;
        this.updateUI();
    }

    logCombat(msg, type = 'normal') {
        const p = document.createElement('p');
        p.textContent = msg;
        if(type === 'success') p.style.color = 'var(--start-color)';
        this.dom.combatLog.appendChild(p);
        this.dom.combatLog.scrollTop = this.dom.combatLog.scrollHeight;
    }

    combatAction(action, skillData = null) {
        if (this.state !== 'COMBAT') return;

        let enemy = this.currentEnemy;
        let damageToEnemy = 0;
        
        if (action === 'flee') {
            if (this.player.air >= 10) {
                this.player.air -= 10;
                this.logCombat('酸素を10消費して逃げ出した！');
                this.updateUI();
                setTimeout(() => {
                    this.state = 'EXPLORE';
                    this.isDiving = true;
                    this.removeEntity(enemy.entity); // Entity disappears
                    this.switchTab('view-dive');
                    this.renderMap();
                    this.updateUI();
                }, 800);
                return;
            } else {
                this.logCombat('逃げるための酸素が足りない！');
                return; // Flee failed, enemy doesn't attack
            }
        }

        if (action === 'attack') {
            damageToEnemy = Math.max(1, this.player.atk - enemy.def + Math.floor(Math.random() * 5));
            enemy.hp -= damageToEnemy;
            this.logCombat(`攻撃！ ${damageToEnemy} ダメージ`);
        } else if (action === 'defend') {
            this.logCombat(`防御姿勢をとった！`);
        } else if (action === 'skill') {
            if (this.player.air < skillData.cost) {
                this.logCombat('酸素が足りない！');
                return;
            }
            this.player.air -= skillData.cost;
            
            if (skillData.type === 'attack' || skillData.type === 'attack_pierce') {
                let baseDmg = this.player.atk;
                let targetDef = skillData.type === 'attack_pierce' ? 0 : enemy.def;
                damageToEnemy = Math.max(1, Math.floor(baseDmg * skillData.mult) - targetDef + Math.floor(Math.random() * 5));
                enemy.hp -= damageToEnemy;
                this.logCombat(`${skillData.name}！ ${damageToEnemy} ダメージ`);
            } else if (skillData.type === 'heal') {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + skillData.power);
                this.logCombat(`${skillData.name}！ HPが ${skillData.power} 回復`);
            }
            this.updateUI();
        }

        if (enemy.hp <= 0) {
            this.logCombat('敵を倒した！', 'success');
            
            if (enemy.data.id === 'shark') {
                this.logCombat('サメを討伐し、宝箱を発見した！', 'success');
                this.player.inventory.push({ rarity: RARITY.GOLD });
            }

            this.updateStats('kills');
            this.updateCombatUI();
            
            setTimeout(() => {
                this.removeEntity(enemy.entity);
                this.state = 'EXPLORE';
                this.isDiving = true; // Resume movement
                this.switchTab('view-dive');
                this.renderMap();
                this.updateUI();
            }, 1200);
            return;
        }

        let damageToPlayer = Math.max(1, enemy.atk - (action === 'defend' ? this.player.def * 2 : this.player.def));
        this.player.hp -= damageToPlayer;
        this.logCombat(`敵の反撃！ ${damageToPlayer} ダメージ`);
        this.updateCombatUI();

        if (this.player.hp <= 0) {
            setTimeout(() => {
                this.triggerGameOver('戦闘で倒れてしまった...');
            }, 1000);
        }
    }

    startSingleTyping(index) {
        if (this.state === 'TYPING') return;
        this.state = 'TYPING';
        this.openingChestIndex = index;
        this.typingQueue = [this.player.inventory[index]];
        this.dom.typingModal.classList.remove('hidden');
        this.nextTypingChest();
    }

    nextTypingChest() {
        if (this.typingQueue.length === 0) {
            this.dom.typingModal.classList.add('hidden');
            this.state = 'EXPLORE';
            this.updateUI();
            return;
        }

        const chest = this.typingQueue[0];
        const words = chest.rarity.words;
        this.currentTypingWord = words[Math.floor(Math.random() * words.length)];
        this.typingIndex = 0;
        
        this.dom.typingInfo.innerHTML = `<span style="display:inline-block; margin-bottom: 10px;"><img src="chest.png" style="width:60px; height:60px; object-fit:contain; filter:drop-shadow(0 0 10px rgba(0,0,0,0.8));"></span> <br> ${chest.rarity.name}箱解錠...`;
        this.updateTypingUI();
        this.dom.typingInput.value = '';
        setTimeout(() => this.dom.typingInput.focus(), 100); // Focus for mobile keyboard
    }

    updateTypingUI() {
        const typed = this.currentTypingWord.substring(0, this.typingIndex);
        const untyped = this.currentTypingWord.substring(this.typingIndex);
        this.dom.typingTarget.innerHTML = `<span class="typed">${typed}</span><span class="untyped">${untyped}</span>`;
        this.dom.typingBar.style.width = `${(this.typingIndex / this.currentTypingWord.length) * 100}%`;
    }

    handleTyping(e) {
        if (this.state !== 'TYPING') return;
        
        const inputChar = e.target.value.toLowerCase().slice(-1);
        e.target.value = '';

        if (inputChar === this.currentTypingWord[this.typingIndex].toLowerCase()) {
            this.typingIndex++;
            this.updateTypingUI();
            
            if (this.typingIndex === this.currentTypingWord.length) {
                this.openChest();
            }
        } else {
            this.dom.typingTarget.classList.add('error');
            setTimeout(() => this.dom.typingTarget.classList.remove('error'), 200);
        }
    }

    openChest() {
        const chest = this.typingQueue.shift();
        
        // Remove from inventory
        this.player.inventory.splice(this.openingChestIndex, 1);
        
        const type = EQUIP_TYPES[Math.floor(Math.random() * EQUIP_TYPES.length)];
        const mult = chest.rarity.name === '金' ? 3 : (chest.rarity.name === '銀' ? 2 : 1);
        
        const item = {
            id: Date.now() + Math.random(),
            name: `${chest.rarity.name}の${type === 'weapon' ? '武器' : type === 'head' ? '頭' : type === 'body' ? '胴' : '腕'}`,
            type: type,
            rarity: chest.rarity.color,
            atk: Math.floor(Math.random() * 5 * mult),
            def: Math.floor(Math.random() * 5 * mult),
            luk: Math.floor(Math.random() * 3 * mult)
        };

        this.player.equipmentInventory.push(item);
        this.updateStats('chestsOpened');
        
        this.updateUI();
        
        this.showNotification("解錠成功！", `${item.name} を入手しました！\n（装備タブから身につけてください）`, "✨", () => {
            this.nextTypingChest();
        });
    }

    equipManualItem(inventoryIndex) {
        const newItem = this.player.equipmentInventory[inventoryIndex];
        const type = newItem.type;
        
        // Remove from inventory
        this.player.equipmentInventory.splice(inventoryIndex, 1);
        
        // If something was equipped, put it back to inventory
        const oldItem = this.player.equipment[type];
        if (oldItem) {
            this.player.equipmentInventory.push(oldItem);
        }
        
        // Equip new item
        this.player.equipment[type] = newItem;
        
        this.log(`${newItem.name}を装備した！`, 'success');
        this.updateUI();
    }

    triggerGameOver(reason) {
        this.state = 'GAMEOVER';
        this.isDiving = false;
        this.player.inventory = []; // Lose chests
        
        this.dom.gameoverMsg.innerHTML = `<span style="color: #ff4d4d; font-size: 1.2rem;">${reason}</span><br>GAME OVER`;
        this.dom.gameoverModal.classList.remove('hidden');
    }
    showNotification(title, msg, icon = '💬', callback = null) {
        document.getElementById('notification-title').textContent = title;
        document.getElementById('notification-msg').textContent = msg;
        document.getElementById('notification-icon').textContent = icon;
        
        const modal = document.getElementById('notification-modal');
        const btn = document.getElementById('notification-ok-btn');
        modal.classList.remove('hidden');
        
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (callback) callback();
        });
    }

    showConfirm(title, msg, icon = '❓', onConfirm) {
        document.getElementById('confirm-title').textContent = title;
        document.getElementById('confirm-msg').textContent = msg;
        document.getElementById('confirm-icon').textContent = icon;
        
        const modal = document.getElementById('confirm-modal');
        const btnCancel = document.getElementById('confirm-cancel-btn');
        const btnOk = document.getElementById('confirm-ok-btn');
        modal.classList.remove('hidden');
        
        const newBtnCancel = btnCancel.cloneNode(true);
        btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
        const newBtnOk = btnOk.cloneNode(true);
        btnOk.parentNode.replaceChild(newBtnOk, btnOk);
        
        newBtnCancel.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        
        newBtnOk.addEventListener('click', () => {
            modal.classList.add('hidden');
            if (onConfirm) onConfirm();
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
