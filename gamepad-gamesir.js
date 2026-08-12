(async () => {
	const { GameSirSDK } = await import('gamesirsdk');

	const MOVE_DEADZONE = 0.35;
	const AIM_DEADZONE = 0.25;
	const TRIGGER_SHOOT = 0.35;
	const AIM_RADIUS = 80;

	let padDrivingMove = false;
	let padShooting = false;

	const sdk = new GameSirSDK({
		deadzone: 0.12,
		remapNintendoLayout: 'auto',
		includeUnknownGamepads: true,
	});

	sdk.on('state', applyPadState);
	sdk.on('disconnect', () => {
		if (padDrivingMove) {
			keys[key_left] = keys[key_right] = keys[key_up] = keys[key_down] = 0;
			padDrivingMove = false;
		}
		if (padShooting) {
			keys[key_shoot] = 0;
			padShooting = false;
		}
	});

	sdk.start();

	function applyPadState(s) {
		const lx = s.axes.lx;
		const ly = s.axes.ly;
		const rx = s.axes.rx;
		const ry = s.axes.ry;
		const stickMove = Math.hypot(lx, ly) >= MOVE_DEADZONE;
		const dpadMove =
			s.buttons.dpadLeft || s.buttons.dpadRight ||
			s.buttons.dpadUp || s.buttons.dpadDown;

		if (stickMove) {
			keys[key_left] = lx < -MOVE_DEADZONE ? 1 : 0;
			keys[key_right] = lx > MOVE_DEADZONE ? 1 : 0;
			keys[key_up] = ly < -MOVE_DEADZONE ? 1 : 0;
			keys[key_down] = ly > MOVE_DEADZONE ? 1 : 0;
			padDrivingMove = true;
		} else if (dpadMove) {
			keys[key_left] = s.buttons.dpadLeft ? 1 : 0;
			keys[key_right] = s.buttons.dpadRight ? 1 : 0;
			keys[key_up] = s.buttons.dpadUp ? 1 : 0;
			keys[key_down] = s.buttons.dpadDown ? 1 : 0;
			padDrivingMove = true;
		} else if (padDrivingMove) {
			keys[key_left] = keys[key_right] = keys[key_up] = keys[key_down] = 0;
			padDrivingMove = false;
		}

		if (Math.hypot(rx, ry) >= AIM_DEADZONE && entity_player) {
			const ox = entity_player.x + 6 + camera_x + c.width * 0.5;
			const oy = -34 + c.height * 0.8;
			mouse_x = ox + rx * AIM_RADIUS;
			mouse_y = oy + ry * AIM_RADIUS;
		}

		const wantShoot = s.buttons.a || s.triggers.rt >= TRIGGER_SHOOT;
		if (wantShoot) {
			keys[key_shoot] = 1;
			padShooting = true;
		} else if (padShooting) {
			keys[key_shoot] = 0;
			padShooting = false;
		}
	}
})();
