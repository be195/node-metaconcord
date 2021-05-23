import "@/extensions/discord-whook";
import * as requestSchema from "./structures/ChatRequest.json";
import * as responseSchema from "./structures/ChatResponse.json";
import { ChatRequest, ChatResponse } from "./structures";
import { GameServer } from "..";
import { Webhook } from "discord-whook.js";
import Discord from "discord.js";
import Payload from "./Payload";
import config from "@/discord.json";

export default class ChatPayload extends Payload {
	protected static requestSchema = requestSchema;
	protected static responseSchema = responseSchema;

	static async handle(payload: ChatRequest, server: GameServer): Promise<void> {
		super.handle(payload, server);
		const { player } = payload.data;
		let { content } = payload.data;
		const { bridge, discord: discordClient } = server;

		const guild = await discordClient.guilds.resolve(config.guildId)?.fetch();
		if (!guild) return;

		const webhook = new Webhook(bridge.config.chatWebhookId, bridge.config.chatWebhookToken);

		const avatar = await bridge.container.getService("Steam").getUserAvatar(player.steamId64);

		const matches = content.match(/@(\S*)/);
		const cachedMembers = new Discord.Collection<string, Discord.GuildMember>();

		if (matches) {
			for (const match of matches) {
				const members = await guild.members.fetch({ query: match, limit: 1 });
				const foundMember = members.first();
				if (!foundMember) continue;

				cachedMembers.set(match, foundMember);
			}
		}

		content = content.replace(/@(\S*)/, (match, name) => {
			if (cachedMembers.has(name)) return `<@!${cachedMembers[name].id}>`;
			return match;
		});

		const motd = bridge.container.getService("Motd");
		if (motd.isValidMsg(content)) {
			motd.pushMessage(content);
			bridge.container.getService("Markov").addLine(content);
		}

		await webhook
			.send(content, `#${server.config.id} ${player.nick}`, avatar, [], {
				parse: ["users", "roles"],
			})
			.catch(console.error);
	}

	static async send(payload: ChatResponse, server: GameServer): Promise<void> {
		super.send(payload, server);
	}
}
