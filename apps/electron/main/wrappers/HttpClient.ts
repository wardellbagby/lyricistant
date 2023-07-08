import axios from 'axios';

export interface HttpClient {
  get: (typeof axios)['get'];
}

export class AxiosHttpClient implements HttpClient {
  public get = axios.get;
}
