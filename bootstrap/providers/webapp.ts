import * as discordConfig from "@/discord.config.json";
import * as express from "express";
import * as webappConfig from "@/webapp.config.json";
import { Container, IService } from "../container";
import { DiscordClient } from "./discord/client";
import { DiscordService } from "./discord";
import { Server as HTTPServer } from "http";

export class WebApp implements IService {
	public name = "WebApp";

	public discord: DiscordClient;
	public server: HTTPServer;
	public app = express();

	public constructor(discord: DiscordClient) {
		this.discord = discord;

		this.app.get("/discord/guild/emojis", (req, res) => {
			const client = this.discord.client;
			if (!client.ran || client.killed)
				return res.status(500).json({
					error: "Bot is not connected",
				});

			const guild = client.guilds.get(discordConfig.guildId);
			if (!guild)
				return res.status(500).json({
					error: "Bot is not part of guild",
				});

			const emojis = JSON.parse(JSON.stringify(guild.emojis));
			for (const emoji of emojis) {
				emoji.url = `https://cdn.discordapp.com/emojis/${emoji.id}.png?v=1`;
			}

			return res.status(200).json(emojis);
		});

		this.server = this.app.listen(webappConfig.port, () => {
			console.log(
				`Server and websocket server listening on ${webappConfig.port}`
			);
		});
	}
}

export default (container: Container): IService => {
	return new WebApp(container.getService(DiscordService).bot);
};
