/* global FrankerFaceZ, fetch */

import Socket from './socket';
import ProUser from './pro_user';

const GIF_EMOTES_MODE = {
    DISABLED: 0,
    STATIC: 1,
    ANIMATED: 2,
};

class BetterTTV extends FrankerFaceZ.utilities.module.Module {
    constructor(...args) {
        super(...args);

        this.inject('settings');
        this.inject('chat');
        this.inject('chat.emotes');
        this.inject('chat.badges');
        this.inject('site');

        this.settings.add('ffzap.betterttv.global_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emotes',
                title: 'Global Emotes',
                description: 'Enable to show global BetterTTV emoticons.',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.betterttv.arbitrary_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emotes',
                title: 'Arbitrary Emotes',
                description: 'Enable to show arbitrary emoticons (like D:, :tf:, (poolparty), :\'(  and similar).',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.betterttv.channel_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emotes',
                title: 'Channel Emotes',
                description: 'Enable to show per-channel BetterTTV emoticons.',
                component: 'setting-check-box',
            },
        });

        this.settings.add('ffzap.betterttv.gif_emoticons_mode', {
            default: 1,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emotes',
                title: 'GIF Emotes',
                description: 'Change the mode of how GIF emoticons are showing up.',
                component: 'setting-select-box',
                data: [
                    { value: 0, title: 'Disabled' },
                    { value: 1, title: 'Enabled (Static GIF Emotes)' },
                    { value: 2, title: 'Enabled (Animated GIF Emotes)' },
                ],
            },
        });

        this.settings.add('ffzap.betterttv.pro_emoticons', {
            default: true,

            ui: {
                path: 'Add-Ons > FFZ:AP > BetterTTV >> Emotes',
                title: 'Pro Emotes',
                description: 'Enable to show BetterTTV Pro emoticons.',
                component: 'setting-check-box',
            },
        });

        this.chat.context.on('changed:ffzap.betterttv.global_emoticons', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.betterttv.arbitrary_emoticons', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.betterttv.channel_emoticons', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.betterttv.gif_emoticons_mode', this.updateEmotes, this);
        this.chat.context.on('changed:ffzap.betterttv.pro_emoticons', () => {
            if (this.chat.context.get('ffzap.betterttv.pro_emoticons')) {
                this.socket.connect();

                for (const room of this.chat.iterateRooms()) {
                    if (room) this.updateChannel(room);
                }
            } else {
                for (const key in this.ProUsers) {
                    if ({}.hasOwnProperty.call(this.ProUsers, key)) {
                        this.ProUsers[key].unload();
                    }
                }
                this.ProUsers = {};

                this.socket.disconnectInternal();
            }	
        }, this);

        this.pro_users = {};
        this.night_subs = {};
        this.socket = false;
    }

    onEnable() {
        this.log.debug('FFZ:AP\'s BetterTTV module was enabled successfully.');

        this.on('chat:room-add', this.roomAdd);
        this.on('chat:room-remove', this.roomRemove);

        this.addBadges();

        this.socket = new Socket(this, this.getSocketEvents());
        this.updateGlobalEmotes();

        if (this.chat.context.get('ffzap.betterttv.pro_emoticons')) {
            this.socket.connect();
        }

        for (const room of this.chat.iterateRooms()) {
            if (room) this.updateChannel(room);
        }

        this.hookBTTVSettingChange();
    }

    roomAdd(room) {
        this.updateChannel(room);
    }

    roomRemove(room) {
        this.updateChannel(room);

        if (this.chat.context.get('ffzap.betterttv.pro_emoticons')) {
            this.socket.partChannel(room.id);
        }
    }

    getSocketEvents() {
        return {
            lookup_user: subscription => {
                if (!subscription.pro || !this.chat.context.get('ffzap.betterttv.pro_emoticons')) {
                    return;
                }

                if (subscription.pro && subscription.emotes) {
                    if (this.pro_users[subscription.name]) {
                        this.pro_users[subscription.name].emotes_array = subscription.emotes;
                        this.pro_users[subscription.name].loadEmotes();
                    } else {
                        this.pro_users[subscription.name] = new ProUser(this, subscription.name, subscription.emotes);
                    }
                }

                if (subscription.subscribed) { // Night's subs
                    if (!(this.night_subs[subscription.name])) {
                        this.night_subs[subscription.name] = true;
                        this.chat.getUser(undefined, subscription.name).addSet('addon--ffzap.betterttv', 'addon--ffzap.betterttv--emotes-special-night');
                    }
                }
            },
        };
    }

    hookBTTVSettingChange(newAttempts = 0) {
        if (window.BetterTTV) {
            window.BetterTTV.settings.on('changed.bttvGIFEmotes', () => this.updateEmotes());
        }
        else {
            setTimeout(this.hookBTTVSettingChange.bind(this, newAttempts), 1000);
        }
    }

    getAnimatedEmoteMode() {
        let emoteMode = this.chat.context.get('ffzap.betterttv.gif_emoticons_mode');
        if (window.BetterTTV && window.BetterTTV.settings.get('bttvGIFEmotes') && emoteMode !== GIF_EMOTES_MODE.DISABLED) {
            emoteMode = GIF_EMOTES_MODE.ANIMATED;
        }

        return emoteMode;
    }

    async addBadges(attempts = 0) {
        const response = await fetch('https://api.betterttv.net/2/badges');
        if (response.ok) {
            const data = await response.json();

            const types = [];
            const _types = data.types;
            const _users = data.badges;

            let i = _types.length;
            while (i--) {
                const _type = _types[i];

                const badgeData = {
                    id: `bttv-${_type.name}`,
                    slot: 21,
                    image: _type.svg,
                    svg: true,
                    title: _type.description,
                    no_invert: true,
                };

                types[_type.name] = true;

                this.badges.loadBadgeData(`addon--ffzap.betterttv--badges-bttv-${_type.name}`, badgeData);
            }

            i = _users.length;
            while (i--) {
                const _user = _users[i];

                if (types[_user.type]) {
                    this.log.debug(`Adding badge "${_user.type}" for user "${_user.name}".`);
                    this.chat.getUser(undefined, _user.name).addBadge('addon--ffzap.betterttv', `addon--ffzap.betterttv--badges-bttv-${_user.type}`);
                }
            }
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch badges. Trying again in 5 seconds.');
                setTimeout(this.addBadges.bind(this, newAttempts), 5000);
            }
        }
    }

    async updateGlobalEmotes(attempts = 0) {
        const realID = 'addon--ffzap.betterttv--emotes-global';
        this.emotes.removeDefaultSet('addon--ffzap.betterttv', realID);
        this.emotes.unloadSet(realID);

        if (!this.chat.context.get('ffzap.betterttv.global_emoticons')) {
            return;
        }

        const response = await fetch('https://api.betterttv.net/2/emotes');
        if (response.ok) {
            const data = await response.json();

            const globalBttv = [];
            const arbitraryEmotes = [];
            const nightSubEmotes = [];

            // const overlayEmotes = {
            //     'SoSnowy': '2px 0 0 0',
            //     'CandyCane': null,
            //     'ReinDeer': null,
            //     'IceCold': '2px 0 0 0',
            //     'TopHat': null,
            //     'SantaHat': null,
            // };

            const { emotes, urlTemplate } = data;

            let i = emotes.length;
            while (i--) {
                const dataEmote = emotes[i];

                const arbitraryEmote = /[^A-Za-z0-9]/.test(dataEmote.code);

                const emote = {
                    id: dataEmote.id,
                    urls: {
                        1: dataEmote.url,
                    },
                    name: dataEmote.code,
                    width: dataEmote.width,
                    height: dataEmote.height,
                    require_spaces: arbitraryEmote,
                    // modifier: overlayEmotes.hasOwnProperty(dataEmote.code),
                    // modifier_offset: overlayEmotes[dataEmote.code],
                };

                const emoteTemplate = `https:${urlTemplate.replace('{{id}}', emote.id)}`;
                emote.urls = {
                    1: emoteTemplate.replace('{{image}}', '1x'),
                    2: emoteTemplate.replace('{{image}}', '2x'),
                    4: emoteTemplate.replace('{{image}}', '3x'),
                };

                if (arbitraryEmote) {
                    arbitraryEmotes.push(emote);
                } else {
                    if (dataEmote.imageType === 'gif') { // If the emote is a GIF
                        if (this.getAnimatedEmoteMode() === GIF_EMOTES_MODE.DISABLED) {
                            // If the GIF setting is set to "Disabled", ignore it.
                            continue;
                        } else if (this.getAnimatedEmoteMode() === GIF_EMOTES_MODE.STATIC) {
                            // If the GIF setting is set to "Static", route them through the cache.
                            emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                            emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                            emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;
                        }
                    }

                    if (dataEmote.channel && dataEmote.channel === 'night') {
                        nightSubEmotes.push(emote);
                    } else {
                        globalBttv.push(emote);
                    }
                }
            }
			
            let set;
            if (nightSubEmotes.length > 0) {
                set = {
                    emoticons: nightSubEmotes,
                    title: 'Night (Legacy)',
                    source: 'BetterTTV',
                    icon: 'https://cdn.betterttv.net/tags/developer.png',
                    sort: 50,
                };
		
                this.emotes.loadSetData('addon--ffzap.betterttv--emotes-special-night', set);
            }

            let setEmotes = [];
            setEmotes = setEmotes.concat(globalBttv);

            if (this.chat.context.get('ffzap.betterttv.arbitrary_emoticons')) {
                setEmotes = setEmotes.concat(arbitraryEmotes);
            }

            if (setEmotes.length === 0) {
                return;
            }

            set = {
                emoticons: setEmotes,
                title: 'Global Emotes',
                source: 'BetterTTV',
                icon: 'https://cdn.betterttv.net/tags/developer.png',
                _type: 1,
            };

            this.emotes.addDefaultSet('addon--ffzap.betterttv', realID, set);
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch global emotes. Trying again in 5 seconds.');
                setTimeout(this.updateGlobalEmotes.bind(this, newAttempts), 5000);
            }
        }
    }

    async updateChannel(room, attempts = 0) {
        const realID = `addon--ffzap.betterttv--channel-${room.id}`;
        room.removeSet('addon--ffzap.betterttv', realID);
        this.emotes.unloadSet(realID);

        if (this.chat.context.get('ffzap.betterttv.pro_emoticons')) {
            this.socket.joinChannel(room.login);
        }

        if (!this.chat.context.get('ffzap.betterttv.channel_emoticons')) {
            return;
        }

        const response = await fetch(`https://api.betterttv.net/2/channels/${room.login}`);
        if (response.ok) {
            const channelBttv = [];
            const { emotes, bots } = await response.json();

            for (const bot of bots) {
                const botUser = room.getUser(null, bot);
                if (botUser) {
                    botUser.addBadge('ffz', 2);
                }
            }

            let i = emotes.length;
            while (i--) {
                const requireSpaces = /[^A-Za-z0-9]/.test(emotes[i].code);

                const emoteFromArray = emotes[i];
                const { id } = emoteFromArray;

                const emote = {
                    urls: {
                        1: `https://cdn.betterttv.net/emote/${id}/1x`,
                        2: `https://cdn.betterttv.net/emote/${id}/2x`,
                        4: `https://cdn.betterttv.net/emote/${id}/3x`,
                    },
                    id,
                    name: emoteFromArray.code,
                    width: 28,
                    height: 28,
                    owner: {
                        display_name: emoteFromArray.channel || room.id,
                        name: emoteFromArray.channel,
                    },
                    require_spaces: requireSpaces,
                };

                if (emoteFromArray.imageType === 'gif') {
                    switch (this.getAnimatedEmoteMode()) {
                    case GIF_EMOTES_MODE.DISABLED:
                        break;

                    case GIF_EMOTES_MODE.STATIC:
                        emote.urls[1] = `https://cache.ffzap.com/${emote.urls[1]}`;
                        emote.urls[2] = `https://cache.ffzap.com/${emote.urls[2]}`;
                        emote.urls[4] = `https://cache.ffzap.com/${emote.urls[4]}`;

                        channelBttv.push(emote);
                        break;

                    case GIF_EMOTES_MODE.ANIMATED:
                        channelBttv.push(emote);
                        break;

                    default:
                        channelBttv.push(emote);
                        break;
                    }
                } else {
                    channelBttv.push(emote);
                }
            }

            if (!channelBttv.length) {
                return;
            }

            const set = {
                emoticons: channelBttv,
                title: 'Channel Emotes',
                source: 'BetterTTV',
                icon: 'https://cdn.betterttv.net/tags/developer.png',
                _type: 1,
            };

            if (channelBttv.length) {
                room.addSet('addon--ffzap.betterttv', realID, set);
            }
        } else {
            if (response.status === 404) return;

            const newAttempts = (attempts || 0) + 1;
            if (newAttempts < 12) {
                this.log.error('Failed to fetch channel emotes. Trying again in 5 seconds.');
                setTimeout(this.updateChannel.bind(this, room, newAttempts), 5000);
            }
        }
    }

    updateEmotes() {
        this.updateGlobalEmotes();

        for (const room of this.chat.iterateRooms()) {
            if (room) this.updateChannel(room);
        }
    }
}

FrankerFaceZ.get().register('addon.ffzap.betterttv', BetterTTV).enable();
