import type { Context } from '@deepseek-ai/cordis'
import SettingsController from '@deepseek-ai/dsh-api-settings-controller'
import { systemBridge } from './protocol.ts'

/**
 * Settings Remote owner using Tauri for Desktop-native path operations.
 * Upstream owns one replaceable integration: the text-editor opener. The Desktop
 * routes it through the shell's system bridge so the document opens with the
 * operating system's own application.
 */
export default class DesktopSettingsController extends SettingsController {
  constructor(ctx: Context) {
    super(ctx, {
      openTextFile: (path, signal) => systemBridge.request<void>('open-path', { path }, signal),
    })
  }
}
