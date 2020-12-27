import PayloadRequest from "./PayloadRequest";
export default interface StatusRequest extends PayloadRequest {
	name: "StatusPayload";
	status: {
		hostname: string;
		players: {
			accountId?: number;
			nick: string;
			avatar?: string;
			isAdmin?: boolean;
		}[];
		map: string;
		workshopMap?: {
			name: string;
			id: string;
		};
		uptime: number;
	};
}