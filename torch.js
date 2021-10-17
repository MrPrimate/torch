/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <shurd@FreeBSD.ORG> wrote this file.  As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return.        Stephen Hurd
 * ----------------------------------------------------------------------------
 */

class Torch {
	static async createDancingLights(tokenId) {
		let token = canvas.tokens.get(tokenId);
		let voff = token.h;
		let hoff = token.w;
		let c = token.center;
		let v = game.settings.get("torch", "dancingLightVision")
		let tokens = [
			{
				"actorData":{}, "actorId":token.actor.id, "actorLink":false, 
				"bar1":{"attribute":""}, "bar2":{"attribute":""}, 
				"brightLight":0, "brightSight":0, "dimLight":10, "dimSight":0, 
				"displayBars":CONST.TOKEN_DISPLAY_MODES.NONE, 
				"displayName":CONST.TOKEN_DISPLAY_MODES.HOVER, 
				"disposition":CONST.TOKEN_DISPOSITIONS.FRIENDLY, 
				"flags":{}, "height":1, "hidden":false, 
				"img":"systems/dnd5e/icons/spells/light-air-fire-1.jpg", 
				"lightAlpha":1, "lightAngle":360, "lockRotation":false, 
				"name":"Dancing Light", "randomimg":false, 
				"rotation":0, "scale":0.25, "mirrorX":false, 
				"sightAngle":360, "vision":v, "width":1, 
				"x":c.x - hoff, "y":c.y - voff
			},
			{
				"actorData":{}, "actorId":token.actor.id, "actorLink":false, 
				"bar1":{"attribute":""}, "bar2":{"attribute":""}, 
				"brightLight":0, "brightSight":0, "dimLight":10, "dimSight":0, 
				"displayBars":CONST.TOKEN_DISPLAY_MODES.NONE, 
				"displayName":CONST.TOKEN_DISPLAY_MODES.HOVER, 
				"disposition":CONST.TOKEN_DISPOSITIONS.FRIENDLY, 
				"flags":{}, "height":1, "hidden":false, 
				"img":"systems/dnd5e/icons/spells/light-air-fire-1.jpg", 
				"lightAlpha":1, "lightAngle":360, "lockRotation":false, 
				"name":"Dancing Light", "randomimg":false, 
				"rotation":0, "scale":0.25, "mirrorX":false, 
				"sightAngle":360, "vision":v, "width":1, 
				"x":c.x, "y":c.y - voff
			},
			{
				"actorData":{}, "actorId":token.actor.id, "actorLink":false, 
				"bar1":{"attribute":""}, "bar2":{"attribute":""}, 
				"brightLight":0, "brightSight":0, "dimLight":10, "dimSight":0, 
				"displayBars":CONST.TOKEN_DISPLAY_MODES.NONE, 
				"displayName":CONST.TOKEN_DISPLAY_MODES.HOVER, 
				"disposition":CONST.TOKEN_DISPOSITIONS.FRIENDLY, 
				"flags":{}, "height":1, "hidden":false, 
				"img":"systems/dnd5e/icons/spells/light-air-fire-1.jpg", 
				"lightAlpha":1, "lightAngle":360, "lockRotation":false, 
				"name":"Dancing Light", "randomimg":false, 
				"rotation":0, "scale":0.25, "mirrorX":false, 
				"sightAngle":360, "vision":v, "width":1, 
				"x":c.x - hoff, "y":c.y
			},
			{
				"actorData":{}, "actorId":token.actor.id, "actorLink":false, 
				"bar1":{"attribute":""}, "bar2":{"attribute":""}, 
				"brightLight":0, "brightSight":0, "dimLight":10, "dimSight":0, 
				"displayBars":CONST.TOKEN_DISPLAY_MODES.NONE, 
				"displayName":CONST.TOKEN_DISPLAY_MODES.HOVER, 
				"disposition":CONST.TOKEN_DISPOSITIONS.FRIENDLY, 
				"flags":{}, "height":1, "hidden":false, 
				"img":"systems/dnd5e/icons/spells/light-air-fire-1.jpg", 
				"lightAlpha":1, "lightAngle":360, "lockRotation":false, 
				"name":"Dancing Light", "randomimg":false, 
				"rotation":0, "scale":0.25, "mirrorX":false, 
				"sightAngle":360, "vision":v, "width":1, 
				"x":c.x, "y":c.y
			}
		];

		if (canvas.scene.createEmbeddedDocuments) { // 0.8
			await canvas.scene.createEmbeddedDocuments(
				"Token", tokens, {"temporary":false, "renderSheet":false});
		} else {
			await canvas.scene.createEmbeddedEntity(
				"Token", tokens, {"temporary":false, "renderSheet":false});
		}
	}
	/*
	 * Send a request to the GM to perform the operation or (if you are a GM)
	 * perform it yourself.
	 */
	static async sendRequest(tokenId, req) {
		req.sceneId = canvas.scene.id ? canvas.scene.id : canvas.scene._id;
		req.tokenId = tokenId;

		if (game.user.isGM) {
			Torch.handleSocketRequest(req);
		} else {
			let recipient;
			if (game.users.contents) { // 0.8 and up
				for (let i=0; i<game.users.contents.length; i++) {
					if (game.users.contents[i].data.role >= 4 && 
						game.users.contents[i].active)
						recipient = game.users.contents[i].data._id;
				}
			} else { // 0.7 and down
				for (let i=0; i<game.users.entities.length; i++) {
					if (game.users.entities[i].data.role >= 4 && 
						game.users.entities[i].active)
						recipient = game.users.entities[i].data._id;
				}
			}
			if (recipient) {
				req.addressTo = recipient;
				game.socket.emit("module.torch", req);
			} else {
				ui.notifications.error("No GM available for Dancing Lights!");
			}
		}
	}

	/*
		* Identify the type of light source we will be using.
		* If not D&D5e, either a player or GM "fiat-lux".
		* IF DND5e:
		* - One of the spells if you've got it - first Dancing Lights then Light.
		* - Otherwise, the specified torch item if you've got it.
		* - Failing all of those, a GM "fiat-lux" or none.
		*/

	static async getLightSourceType(actorId, itemName) {
		if (game.system.id !== 'dnd5e') {
			let playersControlTorches = game.settings.get("torch", "playerTorches");
			return playersControlTorches ? 'Player' : game.user.isGM ? 'GM' : '';
		} else {
			let items = Array.from(game.actors.get(actorId).data.items);
			let interestingItems = items
			.filter( item => 
				(item.type === 'spell' && 
					(item.name === 'Light' || item.name === 'Dancing Lights')) ||
				(item.type !== 'spell' && 
					itemName.toLowerCase() === item.name.toLowerCase()))
			.map( item => item.name);

			// Spells
			if (interestingItems.includes('Dancing Lights')) 
				return 'Dancing Lights';
			if (interestingItems.includes('Light')) 
				return 'Light';
			
			// Item if available
			if (interestingItems.length > 0) {
				let torchItem = items.filter( (item) => {
					return item.name.toLowerCase() === itemName.toLowerCase() 
				});
				let quantity = torchItem.data.data 
					? torchItem.data.data.quantity 
					: item.data.quantity;
				if (quantity > 0) 
					return itemName;
			}
			// GM can always deliver light by fiat without an item
			return game.user.isGM ? 'GM' : '';
		}
	}

	static async consumeTorch(actorId) {
		// Protect against all conditions where we should not consume a torch
		if (game.system.id !== 'dnd5e')
			return;
		if (game.user.isGM && !game.settings.get("torch", "gmUsesInventory"))
			return;
		if (game.actors.get(actorId) === undefined) 
			return;
		let itemName = game.settings.get("torch", "gmInventoryItemName");
		if (Torch.getLightSourceType(actorId, itemName) !== itemName) 
			return;

		// Now we can consume it
		let torchItem = Array.from(game.actors.get(actorId).data.items)
			.find( (item) => item.name.toLowerCase() === itemName.toLowerCase());
		if (torchItem) {
			if (torchItem.data.data) { //0.8 and up
				if (torchItem.data.data.quantity > 0) {
					await torchItem.update(
						{"data.quantity": torchItem.data.data.quantity - 1}
					);
				}
			} else { //0.7 and down
				if (torchItem.data.quantity > 0) {
					await game.actors.get(actorId).updateOwnedItem(
						{"_id": torchItem._id, "data.quantity": torchItem.data.quantity - 1}
					);
				}
			}
		}
	}

	/*
	* Performs inventory tracking for torch uses if we are using a torch as our light source.
	*/
	static async addTorchButton(tokenHUD, hudHtml, hudData) {

		let tokenId = tokenHUD.object.id;
		let tokenDoc = tokenHUD.object.document ? tokenHUD.object.document : tokenHUD.object;
		let itemName = game.settings.get("torch", "gmInventoryItemName");
		let lightSource = Torch.getLightSourceType(hudData.actorId, itemName);

		// Don't let the tokens we create for Dancing Lights have or use torches. :D
		if (data.name === 'Dancing Light' && 
		    hudData.dimLight === 10 && hudData.brightLight === 0) {
			return;
		}

		if (lightSource !== '') {
			let torchDimRadius = game.settings.get("torch", "dimRadius");
			let torchBrightRadius = game.settings.get("torch", "brightRadius");
			let tbutton = $(
				`<div class="control-icon torch"><i class="fas fa-fire"></i></div>`);
			let allowEvent = true;
			let oldTorch = tokenDoc.getFlag("torch", "oldValue");
			let newTorch = tokenDoc.getFlag("torch", "newValue");

			// Clear torch flags if light has been changed somehow.
			if (newTorch !== undefined && newTorch !== null && 
					newTorch !== 'Dancing Lights' && 
			    	(newTorch !== hudData.brightLight + '/' + hudData.dimLight)) {
				await tokenDoc.setFlag("torch", "oldValue", null);
				await tokenDoc.setFlag("torch", "newValue", null);
				oldTorch = null;
				newTorch = null;
			}

			if (newTorch !== undefined && newTorch !== null) {
				// If newTorch is still set, light hasn't changed.
				tbutton.addClass("active");
			}
			/*
			 * If you don't have a torch, *or* you're already emitting more light 
			 * than a torch, disallow the torch button and stack a slash over the flame
			 */
			else if (lightSource === '' || 
					  (lightSource !== 'Dancing Lights' && 
					    hudData.brightLight >= torchBrightRadius && 
					    hudData.dimLight >= torchDimRadius )) {
				let disabledIcon = $(
					`<i class="fas fa-slash" style="position: absolute; color: tomato"></i>`);
				tbutton.addClass("fa-stack");
				tbutton.find('i').addClass('fa-stack-1x');
				disabledIcon.addClass('fa-stack-1x');
				tbutton.append(disabledIcon);
				allowEvent = false;
			}
			hudHtml.find('.col.left').prepend(tbutton);
			if (allowEvent) {
				tbutton.find('i').click(async (ev) => {
					let buttonElement = $(ev.currentTarget.parentElement);
					ev.preventDefault();
					ev.stopPropagation();
					Torch.clickedTorchButton(
						buttonElement, ev.ctrlKey, tokenId, 
						tokenDoc, hudData, lightSource);
				});
			}
		}
	}

	static async clickedTorchButton(
			button, forceOff, tokenId, tokenDoc, hudData, lightSource) {
		let torchOnDimRadius = game.settings.get("torch", "dimRadius");
		let torchOnBrightRadius = game.settings.get("torch", "brightRadius");
		let torchOffDimRadius = game.settings.get("torch", "offDimRadius");
		let torchOffBrightRadius = game.settings.get("torch", "offBrightRadius");
		let oldTorch = tokenDoc.getFlag("torch", "oldValue");
		let newTorch = tokenDoc.getFlag("torch", "newValue");

		if (forceOff) {	// Forcing light off...
			hudData.brightLight = torchOffBrightRadius;
			hudData.dimLight = torchOffDimRadius;
			await tokenDoc.setFlag("torch", "oldValue", null);
			await tokenDoc.setFlag("torch", "newValue", null);
			await Torch.sendRequest(tokenId, {"requestType": "removeDancingLights"});
			button.removeClass("active");
		} else if (oldTorch === null || oldTorch === undefined) {	// Turning light on...
			await tokenDoc.setFlag(
				"torch", "oldValue", hudData.brightLight + '/' + hudData.dimLight);
			if (lightSource === 'Dancing Lights') {
				await Torch.createDancingLights(tokenId);
				await tokenDoc.setFlag("torch", "newValue", 'Dancing Lights');
			} else {
				if (torchOnBrightRadius > hudData.brightLight)
					hudData.brightLight = torchOnBrightRadius;
				if (torchOnDimRadius > hudData.dimLight)
					hudData.dimLight = torchOnDimRadius;
				await tokenDoc.setFlag(
					"torch", "newValue", hudData.brightLight + '/' + hudData.dimLight);
			}
			button.addClass("active");
			// The token light data update must happen before we call useTorch().
			// Updating the quantity on the token's embedded torch item in 
			// consumeTorch() triggers a HUD refresh. If the token light data isn't 
			// updated before that happens, the fresh HUD won't reflect 
			// the torch state we just changed.
			await tokenDoc.update(
				{brightLight: hudData.brightLight, dimLight: hudData.dimLight});
			await Torch.consumeTorch(hudData.actorId);
		} else { // Turning light off...
			if (newTorch === 'Dancing Lights') {
				await Torch.sendRequest(tokenId, {"requestType": "removeDancingLights"});
			} else {
				let thereBeLight = oldTorch.split('/');
				hudData.brightLight = parseFloat(thereBeLight[0]);
				hudData.dimLight = parseFloat(thereBeLight[1]);
			}
			await tokenDoc.setFlag("torch", "newValue", null);
			await tokenDoc.setFlag("torch", "oldValue", null);
			button.removeClass("active");
			await tokenDoc.update(
				{brightLight: hudData.brightLight, dimLight: hudData.dimLight});
		}
	}

	static async handleSocketRequest(req) {
		if (req.addressTo === undefined || req.addressTo === game.user._id) {
			let scn = game.scenes.get(req.sceneId);
			let reqToken = scn.data.tokens.find((token) => {
				return token.id ? (token.id === req.tokenId) : (token._id === req.tokenId);
			});
			let actorId = reqToken.actor ? reqToken.actor.id : reqToken.actorId;
			let dltoks=[];

			switch(req.requestType) {
				case 'removeDancingLights':
					scn.data.tokens.forEach(token => {
						if (actorId === (token.actor ? token.actor.id : token.actorId) &&
						    token.name === 'Dancing Light' &&
						    10 === (token.data ? token.data.dimLight : token.dimLight) &&
						    0 === (token.data ? token.data.brightLight : token.brightLight)) {
							//let dltok = canvas.tokens.get(tok._id);
							if (scn.getEmbeddedDocument) { // 0.8 or higher
								dltoks.push(scn.getEmbeddedDocument("Token", token.id).id);
							} else { // 0.7 or lower
								dltoks.push(scn.getEmbeddedEntity("Token", token._id)._id);
							}
						}
					});
					if (scn.deleteEmbeddedDocuments) { // 0.8 or higher
						await scn.deleteEmbeddedDocuments("Token", dltoks);
					} else { // 0.7 or lower
						await scn.deleteEmbeddedEntity("Token", dltoks);
					}
					break;
			}
		}
	}
}

Hooks.on('ready', () => {
	Hooks.on('renderTokenHUD', (app, html, data) => { 
		Torch.addTorchButton(app, html, data) 
	});
	Hooks.on('renderControlsReference', (app, html, data) => {
		html.find('div').first().append(
			'<h3>Torch</h3><ol class="hotkey-list"><li><h4>'+
			game.i18n.localize("torch.turnOffAllLights")+
			'</h4><div class="keys">'+
			game.i18n.localize("torch.holdCtrlOnClick")+
			'</div></li></ol>');
	});
	game.socket.on("module.torch", request => {
		Torch.handleSocketRequest(request);
	});
});
Hooks.once("init", () => {
	game.settings.register("torch", "playerTorches", {
		name: game.i18n.localize("torch.playerTorches.name"),
		hint: game.i18n.localize("torch.playerTorches.hint"),
		scope: "world",
		config: true,
		default: true,
		type: Boolean
	});
	if (game.system.id === 'dnd5e') {
		game.settings.register("torch", "gmUsesInventory", {
			name: game.i18n.localize("torch.gmUsesInventory.name"),
			hint: game.i18n.localize("torch.gmUsesInventory.hint"),
			scope: "world",
			config: true,
			default: false,
			type: Boolean
		});
		game.settings.register("torch", "gmInventoryItemName", {
			name: game.i18n.localize("torch.gmInventoryItemName.name"),
			hint: game.i18n.localize("torch.gmInventoryItemName.hint"),
			scope: "world",
			config: true,
			default: "torch",
			type: String
		});
	}
	game.settings.register("torch", "brightRadius", {
		name: game.i18n.localize("LIGHT.LightBright"),
		hint: game.i18n.localize("torch.brightRadius.hint"),
		scope: "world",
		config: true,
		default: 20,
		type: Number
	});
	game.settings.register("torch", "dimRadius", {
		name: game.i18n.localize("LIGHT.LightDim"),
		hint: game.i18n.localize("torch.dimRadius.hint"),
		scope: "world",
		config: true,
		default: 40,
		type: Number
	});
	game.settings.register("torch", "offBrightRadius", {
		name: game.i18n.localize("torch.offBrightRadius.name"),
		hint: game.i18n.localize("torch.offBrightRadius.hint"),
		scope: "world",
		config: true,
		default: 0,
		type: Number
	});
	game.settings.register("torch", "offDimRadius", {
		name: game.i18n.localize("torch.offDimRadius.name"),
		hint: game.i18n.localize("torch.offDimRadius.hint"),
		scope: "world",
		config: true,
		default: 0,
		type: Number
	});
	game.settings.register("torch", "dancingLightVision", {
		name: game.i18n.localize("torch.dancingLightVision.name"),
		hint: game.i18n.localize("torch.dancingLightVision.hint"),
		scope: "world",
		config: true,
		default: false,
		type: Boolean
	});
});

console.log("--- Flame on!");
