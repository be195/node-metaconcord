import * as requestSchema from "./structures/BanRequest.json";
import { BanRequest } from "./structures";
import { Embed } from "detritus-client/lib/utils";
import { request as WebSocketRequest } from "websocket";
import Payload from "./Payload";

export default class BanPayload extends Payload {
	protected requestSchema = requestSchema;

	async handle(_: WebSocketRequest, payload: BanRequest): Promise<void> {
		this.validate(this.requestSchema, payload);
		const bridge = this.server.bridge;
		const discordClient = this.server.discord.client;

		const notificationsChannel = await discordClient.rest.fetchChannel(
			bridge.config.notificationsChannelId
		);

		const unixTime = parseInt(payload.ban.unbanTime);
		const unbanDateTime =
			unixTime == NaN
				? "???"
				: new Date(unixTime * 1000).toISOString().slice(0, 19).replace("T", " ");
		const embed = new Embed()
			.setTitle("Ban")
			.addField("Banned", payload.ban.banned, true)
			.addField("Banner", payload.ban.banner, true)
			.addField("Reason", payload.ban.reason, false)
			.addField("Unban Date", unbanDateTime)
			.setColor(0xc42144);

		notificationsChannel.createMessage({ embed });
	}
}