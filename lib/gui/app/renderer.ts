// @ts-nocheck
import { main } from './app';
import './i18n';
import { langParser } from './i18n';
import { ipcRenderer } from 'electron';

ipcRenderer.send('change-lng', langParser());

main();
