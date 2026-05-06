const CONFIG = {
    MAX_AIR: 180,
    BASE_HP: 100,
    DIVE_AIR_COST: 5
};

const DIVE_EVENTS = [
    { type: 'nothing', name: '静かな海', prob: 35, messages: ['静かな海が広がっている...', '特に何も見当たらない。', '泡が立ち上っている。', '深い青が続いている。'] },
    { type: 'enemy', name: '敵に遭遇', prob: 25 },
    { type: 'chest', name: '宝箱発見', prob: 15 },
    { type: 'hazard', name: '強い水流', prob: 5, airLoss: 15, message: '強い水流に巻き込まれた！酸素を余分に消費した。' },
    { type: 'recover_air', name: 'エアポケット', prob: 10, airGain: 20, message: 'エアポケットを発見した！酸素が20回復した。' },
    { type: 'recover_hp', name: '癒やしの海草', prob: 10, hpGain: 20, message: '癒やしの海草を見つけた。HPが20回復した！' }
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

const ENCHANTS = [
    { id: 'lifesteal', name: '吸血', desc: '攻撃時、ダメージの20%HP回復', color: '#ff4d4d' },
    { id: 'crit', name: '会心', desc: '20%の確率でダメージ2倍', color: '#ffd700' },
    { id: 'airsaver', name: '節約', desc: '潜水時の酸素消費を無効化(確率)', color: '#87cefa' },
    { id: 'evasion', name: '見切り', desc: '回避率上昇', color: '#98fb98' }
];

const ENEMIES = [
    { id: 'fish', name: '凶暴な魚', baseHp: 15, atk: 4, def: 1, img: 'enemy_fish.png', prob: 50, chargeChance: 0.1, skillName: '突進準備' },
    { id: 'crab', name: '鎧ガニ', baseHp: 30, atk: 4, def: 8, img: 'enemy_crab.png', prob: 30, chargeChance: 0.2, skillName: 'ハサミを構える' },
    { id: 'squid', name: '深淵のイカ', baseHp: 20, atk: 10, def: 1, img: 'enemy_squid.png', prob: 15, chargeChance: 0.3, skillName: '墨を溜める' },
    { id: 'shark', name: '暴君ザメ', baseHp: 60, atk: 15, def: 4, img: 'enemy_shark.png', prob: 5, chargeChance: 0.4, skillName: '大きく口を開ける' },
    { id: 'boss', name: '海神リヴァイアサン', baseHp: 100, atk: 25, def: 10, img: 'enemy_shark.png', prob: 0, chargeChance: 0.3, skillName: '大渦潮' }
];


class Game {
    constructor() {
        this.player = {
            depth: 0,
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
        this.isAutoCombat = false;
        this.isEnemyTurn = false;
        this.maxDepthReached = 0;
        
        this.initDOM();
        this.bindEvents();
        this.generateQuests();
        this.updateWarpSelection();
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
            diveVisualContainer: document.getElementById('dive-visual-container'),
            logList: document.getElementById('message-log'),
            currentDepth: document.getElementById('current-depth'),
            
            btnStartDive: document.getElementById('btn-start-dive'),
            btnDiveDeeper: document.getElementById('btn-dive-deeper'),
            btnSurface: document.getElementById('btn-surface'),
            
            combatEnemyHp: document.getElementById('combat-enemy-hp'),
            combatEnemyName: document.getElementById('combat-enemy-name'),
            combatEnemyImg: document.getElementById('combat-enemy-img'),
            combatLog: document.getElementById('combat-log'),
            combatSkillsArea: document.getElementById('combat-skills-area'),
            btnAttack: document.getElementById('btn-attack'),
            btnDefend: document.getElementById('btn-defend'),
            btnFlee: document.getElementById('btn-flee'),
            btnAutoCombat: document.getElementById('btn-auto-combat'),
            
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
        
        // Grid related code removed
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
        
        // Dive Commands
        this.dom.btnDiveDeeper.addEventListener('click', () => this.diveAction());
        this.dom.btnSurface.addEventListener('click', () => this.surfaceAction());

        // Keyboard support (Space for dive, R for return)
        document.addEventListener('keydown', (e) => {
            if (!this.isDiving || this.state === 'COMBAT' || this.state === 'TYPING') return;
            if (e.code === 'Space') this.diveAction();
            if (e.key === 'r') this.surfaceAction();
        });

        // Combat
        this.dom.btnAttack.addEventListener('click', () => this.combatAction('attack'));
        this.dom.btnDefend.addEventListener('click', () => this.combatAction('defend'));
        if(this.dom.btnFlee) this.dom.btnFlee.addEventListener('click', () => this.combatAction('flee'));
        if(this.dom.btnAutoCombat) this.dom.btnAutoCombat.addEventListener('click', () => this.toggleAutoCombat());
        
        const btnSynthesize = document.getElementById('btn-synthesize');
        if (btnSynthesize) btnSynthesize.addEventListener('click', () => this.synthesizeAll());
        
        const btnOpenAll = document.getElementById('btn-open-all-chests');
        if (btnOpenAll) btnOpenAll.addEventListener('click', () => this.openAllChests());

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
            this.dom.currentDepth.textContent = this.player.depth;
            
            // Depth visual effect
            const depthFactor = Math.min(this.player.depth / 1000, 1);
            const colorStart = `hsl(${210}, ${70}%, ${45 - (depthFactor * 30)}%)`;
            const colorEnd = `hsl(${210}, ${100}%, ${10 - (depthFactor * 10)}%)`;
            this.dom.diveVisualContainer.style.background = `linear-gradient(to bottom, ${colorStart}, ${colorEnd})`;
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
        const btnOpenAll = document.getElementById('btn-open-all-chests');
        
        if (this.player.inventory.length === 0) {
            this.dom.chestList.innerHTML = '<p class="empty-text">まだ宝箱はありません</p>';
            if (btnOpenAll) btnOpenAll.style.display = 'none';
        } else {
            if (btnOpenAll) btnOpenAll.style.display = 'block';
            this.player.inventory.forEach((chest, index) => {
                const div = document.createElement('div');
                div.className = `chest-item ${chest.rarity.color}`;
                div.innerHTML = `
                    <div style="flex-grow:1; display:flex; align-items:center; gap:10px;">
                        <span><img src="chest.png" style="width:24px; height:24px; object-fit:contain; filter:drop-shadow(0 0 5px rgba(0,0,0,0.5));"></span>
                        <div style="display: flex; flex-direction: column;">
                            <span>${chest.rarity.name}の宝箱</span>
                            <span style="font-size:0.75rem; color:var(--text-muted);">(水深${chest.depth || 0}m)</span>
                        </div>
                    </div>
                    <button class="btn info open-btn" data-index="${index}" style="padding: 6px 12px; font-size: 0.9rem;">開ける</button>
                `;
                this.dom.chestList.appendChild(div);
            });
            
            this.dom.chestList.querySelectorAll('.open-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const idx = parseInt(e.currentTarget.dataset.index, 10);
                    this.openChest(idx);
                });
            });
        }
        
        // Equipment
        EQUIP_TYPES.forEach(type => {
            const el = document.getElementById(`equip-${type}`).querySelector('.item-name');
            const item = this.player.equipment[type];
            el.innerHTML = item ? `${item.name}${item.enchant ? ` <span style="color:${item.enchant.color}; font-size:0.8rem;">[${item.enchant.name}]</span>` : ''}` : '-';
            
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
                av.el.textContent = '';
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
                const encHtml = item.enchant ? `<div style="color:${item.enchant.color}; font-size: 0.8rem; margin-top:3px;">[${item.enchant.name}] ${item.enchant.desc}</div>` : '';
                btn.innerHTML = `
                    <div class="item-type">${item.type === 'weapon' ? '武器' : item.type === 'head' ? '頭' : item.type === 'body' ? '胴' : '腕'}</div>
                    <div style="font-weight: bold; font-size: 0.9rem;">${item.name}</div>
                    <div class="item-stats">ATK+${item.atk} DEF+${item.def} LUK+${item.luk}</div>
                    ${encHtml}
                `;
                btn.addEventListener('click', () => this.equipManualItem(index));
                this.dom.equipmentList.appendChild(btn);

                // Blacksmith Tab
                const bBtn = document.createElement('div');
                bBtn.className = `chest-item ${item.rarity === 'gold' ? 'gold' : (item.rarity === 'silver' ? 'silver' : 'bronze')}`;
                bBtn.innerHTML = `
                    <div style="flex-grow:1;">
                        <span style="font-weight:bold;">${item.name}</span>
                        <span style="font-size:0.8rem; color:gray; margin-left:10px;">分解: ${item.rarity === 'gold' ? 30 : (item.rarity === 'silver' ? 15 : 5)}🪙</span>
                        ${encHtml}
                    </div>
                    <div style="display:flex; gap: 5px; align-items:center;">
                        <button class="btn info reroll-btn" style="padding: 4px 10px; font-size: 0.8rem;" data-index="${index}">🎲ﾘﾛｰﾙ(10🪙)</button>
                        <button class="btn danger dismantle-btn" style="padding: 4px 10px; font-size: 0.8rem;" data-index="${index}">分解</button>
                    </div>
                `;
                bBtn.querySelector('.dismantle-btn').addEventListener('click', (e) => {
                    this.dismantleEquipment(parseInt(e.currentTarget.dataset.index, 10));
                });
                bBtn.querySelector('.reroll-btn').addEventListener('click', (e) => {
                    this.rerollEquipment(parseInt(e.currentTarget.dataset.index, 10));
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

    updateWarpSelection() {
        const select = document.getElementById('select-warp-depth');
        if (!select) return;
        
        select.innerHTML = '<option value="0">0m (水面)</option>';
        const maxWarp = Math.floor(this.maxDepthReached / 100) * 100;
        
        for (let d = 100; d <= maxWarp; d += 100) {
            const opt = document.createElement('option');
            opt.value = d;
            opt.textContent = `${d}m から開始`;
            select.appendChild(opt);
        }
    }

    startDive() {
        this.isDiving = true;
        this.state = 'EXPLORE';
        this.dom.startOverlay.classList.remove('active');
        this.dom.mapArea.classList.remove('hidden');
        
        this.player.air = this.player.maxAir;
        
        const warpSelect = document.getElementById('select-warp-depth');
        if (warpSelect && warpSelect.value !== "0") {
            this.player.depth = parseInt(warpSelect.value, 10);
            this.dom.logList.innerHTML = '';
            this.log(`深度 ${this.player.depth}m にワープした！`, 'important');
        } else {
            this.player.depth = 0;
            this.dom.logList.innerHTML = '';
            this.log('潜水を開始した！', 'important');
        }
        
        this.updateUI();
    }

    endDive() {
        this.isDiving = false;
        this.dom.startOverlay.classList.add('active');
        this.dom.mapArea.classList.add('hidden');
        this.updateWarpSelection();
        this.updateUI();
    }

    diveAction() {
        if (!this.isDiving || this.state !== 'EXPLORE') return;
        let cost = CONFIG.DIVE_AIR_COST;
        if (Object.values(this.player.equipment).some(eq => eq && eq.enchant && eq.enchant.id === 'airsaver')) {
            if (Math.random() < 0.2) {
                cost = 0;
                this.log('【節約】酸素の消費を無効化した！', 'success');
            }
        }

        if (this.player.air < cost) {
            this.log('酸素が足りなくて潜れない！', 'important');
            return;
        }

        // Visual feedback
        this.dom.diveVisualContainer.classList.add('diving-fast');
        setTimeout(() => this.dom.diveVisualContainer.classList.remove('diving-fast'), 600);

        this.player.air -= cost;
        this.player.depth += Math.floor(Math.random() * 10) + 5;
        if (this.player.depth > this.maxDepthReached) this.maxDepthReached = this.player.depth;
        
        if (cost > 0) {
            this.log(`${this.player.depth}m 地点へ潜った... (🫧-${cost})`);
        } else {
            this.log(`${this.player.depth}m 地点へ潜った...`);
        }

        this.updateUI();
        this.triggerRandomEvent();
    }

    surfaceAction() {
        if (!this.isDiving || this.state !== 'EXPLORE') return;
        
        this.log('生還を試みている...', 'important');
        const msg = this.player.inventory.length > 0 ? `深度 ${this.player.depth}m から無事に生還した！\n宝箱を持ち帰りました。` : `深度 ${this.player.depth}m から無事に生還した！`;
        this.showNotification("生還した！", msg, "🦦", () => {
            this.endDive();
        });
    }

    triggerRandomEvent() {
        const roll = Math.random() * 100;
        let cumulative = 0;
        let event = DIVE_EVENTS[0];
        for (let e of DIVE_EVENTS) {
            cumulative += e.prob;
            if (roll < cumulative) {
                event = e;
                break;
            }
        }

        if (event.type === 'nothing') {
            const msg = event.messages[Math.floor(Math.random() * event.messages.length)];
            this.log(msg);
        } else if (event.type === 'chest') {
            this.getChest();
        } else if (event.type === 'enemy') {
            this.startCombat();
        } else if (event.type === 'hazard') {
            this.log(event.message, 'important');
            this.player.air -= event.airLoss;
            this.updateUI();
        } else if (event.type === 'recover_air') {
            this.log(event.message, 'success');
            this.player.air = Math.min(this.player.maxAir, this.player.air + event.airGain);
            this.updateUI();
        } else if (event.type === 'recover_hp') {
            this.log(event.message, 'success');
            this.player.hp = Math.min(this.player.maxHp, this.player.hp + event.hpGain);
            this.updateUI();
        }
        
        this.checkAir();
    }

    checkAir() {
        if (this.player.air <= 0) {
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

        this.player.inventory.push({ rarity, depth: this.player.depth });
        this.log(`${rarity.name}箱を入手！`, 'success');
        this.showNotification("宝箱発見！", `${rarity.name}の宝箱を見つけました！`, "📦");
    }

    startCombat() {
        this.state = 'TRANSITION';
        this.isDiving = false; 
        
        let selectedEnemy = ENEMIES[0];
        
        if (this.player.depth >= 100 && Math.random() < 0.3) {
            selectedEnemy = ENEMIES.find(e => e.id === 'boss');
        } else {
            const roll = Math.random() * 100;
            let cumulative = 0;
            for (let e of ENEMIES) {
                if (e.id === 'boss') continue;
                cumulative += e.prob;
                if (roll < cumulative) {
                    selectedEnemy = e;
                    break;
                }
            }
        }

        const scale = 1 + (this.player.depth / 100);
        this.currentEnemy = {
            data: selectedEnemy,
            hp: Math.floor((selectedEnemy.baseHp + Math.floor(Math.random() * 10)) * scale),
            maxHp: Math.floor((selectedEnemy.baseHp + Math.floor(Math.random() * 10)) * scale),
            atk: Math.floor((selectedEnemy.atk + Math.floor(Math.random() * 3)) * scale),
            def: Math.floor(selectedEnemy.def * scale),
            isCharging: false
        };
        
        if(this.dom.encounterOverlay) {
            this.dom.encounterOverlay.classList.remove('hidden');
            this.dom.encounterOverlay.classList.add('flash');
        }
        
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
        if(type === 'important') {
            p.style.color = 'var(--color-hp)';
            p.style.fontWeight = 'bold';
            p.style.fontSize = '1.1rem';
        }
        this.dom.combatLog.appendChild(p);
        this.dom.combatLog.scrollTop = this.dom.combatLog.scrollHeight;
    }

    combatAction(action, skillData = null) {
        if (this.state !== 'COMBAT') return;
        if (this.isEnemyTurn) return;
        this.isEnemyTurn = true;

        let enemy = this.currentEnemy;
        let damageToEnemy = 0;
        
        if (action === 'flee') {
            if (this.player.air >= 10) {
                this.player.air -= 10;
                this.logCombat('酸素を10消費して逃げ出した！');
                this.updateUI();
                this.isAutoCombat = false;
                setTimeout(() => {
                    this.state = 'EXPLORE';
                    this.isDiving = true;
                    this.switchTab('view-dive');
                    this.updateUI();
                    this.isEnemyTurn = false;
                }, 800);
                return;
            } else {
                this.logCombat('逃げるための酸素が足りない！');
                this.isEnemyTurn = false;
                this.isAutoCombat = false;
                return; 
            }
        }

        if (action === 'attack') {
            damageToEnemy = Math.max(1, this.player.atk - enemy.def + Math.floor(Math.random() * 5));
        } else if (action === 'defend') {
            this.logCombat(`防御姿勢をとった！`);
        } else if (action === 'skill') {
            if (this.player.air < skillData.cost) {
                this.logCombat('酸素が足りない！');
                this.isEnemyTurn = false;
                this.isAutoCombat = false;
                return;
            }
            this.player.air -= skillData.cost;
            
            if (skillData.type === 'attack' || skillData.type === 'attack_pierce') {
                let baseDmg = this.player.atk;
                let targetDef = skillData.type === 'attack_pierce' ? 0 : enemy.def;
                damageToEnemy = Math.max(1, Math.floor(baseDmg * skillData.mult) - targetDef + Math.floor(Math.random() * 5));
            } else if (skillData.type === 'heal') {
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + skillData.power);
                this.logCombat(`${skillData.name}！ HPが ${skillData.power} 回復`);
            }
            this.updateUI();
        }

        // Apply Player Attack Enchants
        if (damageToEnemy > 0) {
            let isCrit = false;
            if (Object.values(this.player.equipment).some(eq => eq && eq.enchant && eq.enchant.id === 'crit')) {
                if (Math.random() < 0.2) isCrit = true;
            }
            if (isCrit) {
                damageToEnemy *= 2;
                this.logCombat(`【会心】痛恨の一撃！ ${damageToEnemy} ダメージ`);
            } else {
                this.logCombat(`攻撃！ ${damageToEnemy} ダメージ`);
            }
            enemy.hp -= damageToEnemy;

            if (Object.values(this.player.equipment).some(eq => eq && eq.enchant && eq.enchant.id === 'lifesteal')) {
                let lifesteal = Math.floor(damageToEnemy * 0.2);
                if (lifesteal > 0) {
                    this.player.hp = Math.min(this.player.maxHp, this.player.hp + lifesteal);
                    this.logCombat(`【吸血】HPを ${lifesteal} 回復！`, 'success');
                }
            }
        }

        if (enemy.hp <= 0) {
            this.logCombat('敵を倒した！', 'success');
            
            this.logCombat('宝箱をドロップした！', 'success');
            if (enemy.data.id === 'shark' || enemy.data.id === 'boss') {
                this.player.inventory.push({ rarity: RARITY.GOLD, depth: this.player.depth });
            } else if (enemy.data.id === 'crab' || enemy.data.id === 'squid') {
                this.player.inventory.push({ rarity: RARITY.SILVER, depth: this.player.depth });
            } else {
                this.player.inventory.push({ rarity: RARITY.BRONZE, depth: this.player.depth });
            }

            this.updateStats('kills');
            this.updateCombatUI();
            
            setTimeout(() => {
                this.state = 'EXPLORE';
                this.isDiving = true; 
                this.switchTab('view-dive');
                this.updateUI();
                this.isEnemyTurn = false;
                if (this.isAutoCombat) this.runAutoCombat(); // Continue auto dive maybe? Actually we should stop auto on explore, or let it auto dive? Let's just stop auto combat at end.
                this.isAutoCombat = false;
                if(document.getElementById('btn-auto-combat')) {
                    document.getElementById('btn-auto-combat').classList.remove('active');
                }
            }, 1200);
            return;
        }

        // Enemy Turn
        setTimeout(() => {
            let dmg = 0;
            let evadeChance = Math.min(0.5, this.player.luk * 0.02);
            if (Object.values(this.player.equipment).some(eq => eq && eq.enchant && eq.enchant.id === 'evasion')) {
                evadeChance += 0.1;
            }

            if (enemy.isCharging) {
                // Unleash heavy attack
                dmg = Math.max(2, Math.floor(enemy.atk * 2.5) - (action === 'defend' ? this.player.def * 2.5 : this.player.def));
                
                if (Math.random() < evadeChance && action !== 'defend') {
                    this.logCombat(`【見切り】強攻撃を紙一重で回避した！`, 'success');
                    dmg = 0;
                } else {
                    this.logCombat(`強攻撃！！ ${dmg} ダメージ`, 'important');
                }
                enemy.isCharging = false;
            } else {
                // Normal or Start Charge
                if (Math.random() < (enemy.data.chargeChance || 0.1)) {
                    enemy.isCharging = true;
                    this.logCombat(`${enemy.data.name}は${enemy.data.skillName}！力を溜めている…！`, 'success');
                } else {
                    dmg = Math.max(1, enemy.atk - (action === 'defend' ? this.player.def * 2 : this.player.def));
                    if (Math.random() < evadeChance && action !== 'defend') {
                        this.logCombat(`【見切り】敵の攻撃を回避した！`, 'success');
                        dmg = 0;
                    } else {
                        this.logCombat(`敵の反撃！ ${dmg} ダメージ`);
                    }
                }
            }

            if (dmg > 0) {
                this.player.hp -= dmg;
                this.updateCombatUI();
                if (this.player.hp <= 0) {
                    this.triggerGameOver("力尽きてしまった…");
                }
            }

            this.isEnemyTurn = false;
            
            if (this.isAutoCombat && this.state === 'COMBAT' && this.player.hp > 0) {
                setTimeout(() => this.runAutoCombat(), 500);
            }
        }, 600);
    }

    openChest(index, skipNotify = false) {
        const chest = this.player.inventory[index];
        this.player.inventory.splice(index, 1);
        
        const type = EQUIP_TYPES[Math.floor(Math.random() * EQUIP_TYPES.length)];
        const mult = chest.rarity.name === '金' ? 3 : (chest.rarity.name === '銀' ? 2 : 1);
        
        const scale = 1 + ((chest.depth || 0) / 100);
        
        const hasEnchant = Math.random() < (chest.rarity.name === '金' ? 0.8 : (chest.rarity.name === '銀' ? 0.4 : 0.1));
        let enchant = null;
        if (hasEnchant) {
            enchant = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)];
        }
        
        const item = {
            id: Date.now() + Math.random(),
            name: `${chest.rarity.name}の${type === 'weapon' ? '武器' : type === 'head' ? '頭' : type === 'body' ? '胴' : '腕'}`,
            type: type,
            rarity: chest.rarity.color,
            atk: Math.floor((Math.random() * 5 * mult + 1) * scale),
            def: Math.floor((Math.random() * 5 * mult + 1) * scale),
            luk: Math.floor((Math.random() * 3 * mult) * scale),
            enchant: enchant
        };

        this.player.equipmentInventory.push(item);
        this.updateStats('chestsOpened');
        
        this.updateUI();
        
        if (!skipNotify) {
            const encText = enchant ? `\n[${enchant.name}] 効果付き！` : '';
            this.showNotification("解錠成功！", `${item.name} を入手しました！${encText}\n（装備タブから身につけてください）`, "✨");
        }
    }

    openAllChests() {
        if (this.player.inventory.length === 0) return;
        
        let openedCount = this.player.inventory.length;
        let gold = 0, silver = 0, bronze = 0;
        
        while(this.player.inventory.length > 0) {
            const chest = this.player.inventory[0];
            if (chest.rarity.name === '金') gold++;
            else if (chest.rarity.name === '銀') silver++;
            else bronze++;
            
            this.openChest(0, true);
        }
        
        this.updateUI();
        this.showNotification("一括解錠完了！", `宝箱を ${openedCount} 個開けました！\n（金:${gold} 銀:${silver} 銅:${bronze}）\n装備タブをご確認ください。`, "📦");
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

    toggleAutoCombat() {
        this.isAutoCombat = !this.isAutoCombat;
        if (this.dom.btnAutoCombat) {
            if (this.isAutoCombat) {
                this.dom.btnAutoCombat.classList.add('active');
                this.dom.btnAutoCombat.style.background = 'var(--start-color)';
                this.dom.btnAutoCombat.textContent = 'オート：ON';
                this.runAutoCombat();
            } else {
                this.dom.btnAutoCombat.classList.remove('active');
                this.dom.btnAutoCombat.style.background = 'var(--text-muted)';
                this.dom.btnAutoCombat.textContent = 'オート：OFF';
            }
        }
    }

    runAutoCombat() {
        if (!this.isAutoCombat || this.state !== 'COMBAT' || this.isEnemyTurn || this.player.hp <= 0) return;
        this.combatAction('attack');
    }

    giveRandomEquipment(rarity, depth) {
        const type = EQUIP_TYPES[Math.floor(Math.random() * EQUIP_TYPES.length)];
        const mult = rarity.name === '金' ? 3 : (rarity.name === '銀' ? 2 : 1);
        const scale = 1 + (depth / 100);
        
        const hasEnchant = Math.random() < (rarity.name === '金' ? 0.8 : (rarity.name === '銀' ? 0.4 : 0.1));
        let enchant = null;
        if (hasEnchant) enchant = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)];
        
        const item = {
            id: Date.now() + Math.random(),
            name: `${rarity.name}の${type === 'weapon' ? '武器' : type === 'head' ? '頭' : type === 'body' ? '胴' : '腕'}`,
            type: type,
            rarity: rarity.color,
            atk: Math.floor((Math.random() * 5 * mult + 1) * scale),
            def: Math.floor((Math.random() * 5 * mult + 1) * scale),
            luk: Math.floor((Math.random() * 3 * mult) * scale),
            enchant: enchant
        };
        this.player.equipmentInventory.push(item);
    }

    synthesizeAll() {
        let bronze = [], silver = [];
        this.player.equipmentInventory.forEach(item => {
             if (item.rarity === 'bronze') bronze.push(item);
             if (item.rarity === 'silver') silver.push(item);
        });
        
        let newItemsCount = 0;
        let consumed = new Set();
        
        while(bronze.length >= 3) {
             bronze.splice(0, 3).forEach(i => consumed.add(i));
             this.giveRandomEquipment(RARITY.SILVER, this.maxDepthReached);
             newItemsCount++;
        }
        while(silver.length >= 3) {
             silver.splice(0, 3).forEach(i => consumed.add(i));
             this.giveRandomEquipment(RARITY.GOLD, this.maxDepthReached);
             newItemsCount++;
        }
        
        if (newItemsCount > 0) {
             this.player.equipmentInventory = this.player.equipmentInventory.filter(item => !consumed.has(item));
             this.updateUI();
             this.showNotification("合成成功！", `装備を合成し、上位レアリティの装備を ${newItemsCount} 個獲得しました！`, "⚒️");
        } else {
             this.showNotification("エラー", "合成可能な装備が足りません。\n（同レアリティのハズレ装備が3つ必要です）", "❌");
        }
    }

    rerollEquipment(index) {
        if (this.player.coins < 10) {
            this.showNotification("エラー", "コインが足りません！(10🪙必要)", "🪙");
            return;
        }
        
        this.showConfirm("リロール確認", "10🪙消費してステータスと特殊効果を再抽選しますか？", "🎲", () => {
            this.player.coins -= 10;
            const item = this.player.equipmentInventory[index];
            const mult = item.rarity === 'gold' ? 3 : (item.rarity === 'silver' ? 2 : 1);
            const scale = 1 + (this.maxDepthReached / 100);
            
            const hasEnchant = Math.random() < (item.rarity === 'gold' ? 0.8 : (item.rarity === 'silver' ? 0.4 : 0.1));
            let enchant = null;
            if (hasEnchant) {
                enchant = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)];
            }
            
            item.atk = Math.floor((Math.random() * 5 * mult + 1) * scale);
            item.def = Math.floor((Math.random() * 5 * mult + 1) * scale);
            item.luk = Math.floor((Math.random() * 3 * mult) * scale);
            item.enchant = enchant;
            
            this.updateUI();
            this.showNotification("リロール完了", `${item.name} の性能が新しくなりました！`, "✨");
        });
    }

    resetGame() {
        location.reload();
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
