import { Injectable } from '@angular/core';
import type { App } from 'server';
import { edenClient } from '../libs/edenclient';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  client = edenClient<App>('http://localhost:4201', {
    withCredentials: true,
  }).api;
}
