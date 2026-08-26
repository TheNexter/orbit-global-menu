// Generic menu for applications that export no menu of their own and have no
// curated shortcut mapping either. Adapted from Global Menu for GNOME
// (globalmenu@ShiroOSL.github.io).
//
// Items act through window operations, spawned commands, or a keyboard
// shortcut synthesized into the focused app.

import GLib from 'gi://GLib';
import Shell from 'gi://Shell';

import {MenuBarButton} from './menuBarButton.js';
import {addBarButton} from './panelBar.js';
import {WindowActions} from './windowActions.js';
import {sendShortcut} from './keySynth.js';

// The daemon briefly reports no menus while windows are switching, so wait
// this long before concluding an app really has none.
const SHOW_FALLBACK_DELAY_MS = 400;

// Commands run for actions that have no dependable keybinding to guess at.
const ACTION_COMMANDS = {
	'open-files': `xdg-open ${GLib.get_home_dir()}`,
	'new-folder': `mkdir -p ${GLib.get_home_dir()}/Desktop/'Untitled Folder'`,
	'open-settings': 'gnome-control-center',
	'empty-trash': 'gio trash --empty',
	'lock-screen': 'gdbus call --session --dest org.gnome.ScreenSaver ' +
		'--object-path /org/gnome/ScreenSaver --method org.gnome.ScreenSaver.Lock',
	'suspend': 'systemctl suspend',
	'hibernate': 'systemctl hibernate',
	'log-out': 'gnome-session-quit --logout --no-prompt',
	'power-off': 'gnome-session-quit --power-off --no-prompt',
};

// Actions sent to the focused app as keystrokes. These are the stock GNOME
// and application defaults, so a user who has rebound one gets a stale guess.
// There is no way to ask an app what its shortcut for Copy is.
const ACTION_SHORTCUTS = {
	'copy': '<Ctrl>C',
	'paste': '<Ctrl>V',
	'cut': '<Ctrl>X',
	'undo': '<Ctrl>Z',
	'redo': '<Ctrl>Y',
	'select-all': '<Ctrl>A',
	'new-tab': '<Ctrl>T',
	'go-back': '<Alt>Left',
	'go-forward': '<Alt>Right',
	'delete-item': 'Delete',
	'virtual-open': 'Return',
	'properties': '<Alt>Return',
	'screenshot-full': 'Print',
	'screenshot-window': '<Alt>Print',
	'screenshot-area': '<Shift>Print',
	'snap-left': '<Super>Left',
	'snap-right': '<Super>Right',
	'switch-windows': '<Super>Tab',
	'cycle-windows': '<Alt>Escape',
	'cycle-app-windows': "<Super>`",
	'window-menu': '<Alt>space',
	'next-workspace': '<Super>Page_Down',
	'previous-workspace': '<Super>Page_Up',
	'first-workspace': '<Super>Home',
	'show-applications': '<Super>A',
	'show-notifications': '<Super>V',
};

function executeFallbackAction(action) {
	// Window and session state is changed directly wherever the API allows
	// it, which beats guessing at a keybinding
	if (action === 'close') {
		new WindowActions().doAction('Close');
		return true;
	}
	if (action === 'show-desktop') {
		global.workspace_manager.get_active_workspace().list_windows()
			.filter(w => !w.minimized && !w.is_skip_taskbar())
			.forEach(w => w.minimize());
		return true;
	}

	const command = ACTION_COMMANDS[action];
	if (command) {
		try {
			GLib.spawn_command_line_async(command);
		} catch (e) {
			console.error(`[orbit-fallback] ${action} failed: ${e}`);
		}
		return true;
	}

	const accel = ACTION_SHORTCUTS[action];
	if (accel)
		return sendShortcut(accel);

	return false;
}

// Mirrors gnome-shell's own window menu, so it is rebuilt on every open from
// the live window state, plus a static block of window-switching and tiling
// shortcuts that do not depend on the focused window.
function windowMenuSpecs() {
	const windowActions = new WindowActions();
	const actions = windowActions.getActions();
	const specs = actions.length === 0
		? [{label: 'No Window', enabled: false}]
		: actions.map(action => ({
			label: action,
			onActivate: () => windowActions.doAction(action),
		}));
	specs.push(
		{separator: true},
		{label: 'Snap Window Left', onActivate: () => executeFallbackAction('snap-left')},
		{label: 'Snap Window Right', onActivate: () => executeFallbackAction('snap-right')},
		{separator: true},
		{label: 'Switch Between Windows', onActivate: () => executeFallbackAction('switch-windows')},
		{label: 'Cycle Through Windows', onActivate: () => executeFallbackAction('cycle-windows')},
		{label: 'Switch Windows of Same App', onActivate: () => executeFallbackAction('cycle-app-windows')},
		{label: 'Window Menu', onActivate: () => executeFallbackAction('window-menu')}
	);
	return specs;
}

function toSpecs(items) {
	return items.map(item => {
		if (item.separator)
			return {separator: true};
		return {label: item.label, onActivate: () => executeFallbackAction(item.action)};
	});
}

const MENU_DATA = [
	{
		label: 'Desktop',
		appName: true,
		items: [
			{label: 'Open Files', action: 'open-files'},
			{label: 'Settings', action: 'open-settings'},
			{separator: true},
			{label: 'Empty Trash', action: 'empty-trash'},
		],
	},
	{
		label: 'File',
		items: [
			{label: 'New Window', action: 'open-files'},
			{label: 'New Folder on Desktop', action: 'new-folder'},
			{label: 'New Tab', action: 'new-tab'},
			{label: 'Open', action: 'virtual-open'},
			{separator: true},
			{label: 'Properties', action: 'properties'},
			{separator: true},
			{label: 'Show Desktop', action: 'show-desktop'},
			{separator: true},
			{label: 'Close Window', action: 'close'},
		],
	},
	{
		label: 'Edit',
		items: [
			{label: 'Undo', action: 'undo'},
			{label: 'Redo', action: 'redo'},
			{separator: true},
			{label: 'Cut', action: 'cut'},
			{label: 'Copy', action: 'copy'},
			{label: 'Paste', action: 'paste'},
			{label: 'Delete', action: 'delete-item'},
			{separator: true},
			{label: 'Select All', action: 'select-all'},
			{separator: true},
			{label: 'Take Screenshot', action: 'screenshot-full'},
			{label: 'Screenshot of Window', action: 'screenshot-window'},
			{label: 'Screenshot of Area', action: 'screenshot-area'},
		],
	},
	{
		label: 'Go',
		items: [
			{label: 'Back', action: 'go-back'},
			{label: 'Forward', action: 'go-forward'},
			{separator: true},
			{label: 'Next Workspace', action: 'next-workspace'},
			{label: 'Previous Workspace', action: 'previous-workspace'},
			{label: 'First Workspace', action: 'first-workspace'},
		],
	},
	{
		label: 'Window',
		windowActions: true,
	},
	{
		label: 'System',
		items: [
			{label: 'Show Applications', action: 'show-applications'},
			{label: 'Show Notifications', action: 'show-notifications'},
			{separator: true},
			{label: 'Lock Screen', action: 'lock-screen'},
			{label: 'Suspend', action: 'suspend'},
			{label: 'Hibernate', action: 'hibernate'},
			{separator: true},
			{label: 'Log Out', action: 'log-out'},
			{label: 'Power Off / Restart', action: 'power-off'},
		],
	},
];

/**
 * The first button always shows the focused app's name. The generic ones are
 * hidden by MenuBar whenever the app has a menu of its own.
 */
export class FallbackMenu {
	constructor(uuid) {
		this._buttons = [];
		this._appButton = null;
		this._showTimeoutId = 0;

		MENU_DATA.forEach((entry, index) => {
			const btn = new MenuBarButton(entry.label, entry.appName ? {appName: true} : {});
			btn.setItems(entry.windowActions ? windowMenuSpecs : toSpecs(entry.items));
			// MENU_DATA[0] is the app name, so the index doubles as the rank
			addBarButton(`${uuid}-fallback-${index}`, btn, index);
			this._buttons.push(btn);
			if (entry.appName)
				this._appButton = btn;
		});

		this.updateAppName();
	}

	updateAppName() {
		const app = Shell.WindowTracker.get_default().focus_app;
		this._appButton?.setLabel(app?.get_name() ?? 'Desktop');
	}

	setNativeMenusPresent(present) {
		this._cancelPendingShow();
		if (present) {
			this._genericButtons().forEach(btn => btn.hide());
			return;
		}
		this._showTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, SHOW_FALLBACK_DELAY_MS, () => {
			this._genericButtons().forEach(btn => btn.show());
			this._showTimeoutId = 0;
			return GLib.SOURCE_REMOVE;
		});
	}

	closeAllMenus() {
		this._buttons.forEach(btn => btn.menu.close());
	}

	destroy() {
		this._cancelPendingShow();
		this._buttons.forEach(btn => btn.destroy());
		this._buttons = [];
		this._appButton = null;
	}

	_genericButtons() {
		return this._buttons.filter(btn => btn !== this._appButton);
	}

	_cancelPendingShow() {
		if (!this._showTimeoutId)
			return;
		GLib.source_remove(this._showTimeoutId);
		this._showTimeoutId = 0;
	}
}
