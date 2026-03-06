import axios, { type AxiosInstance } from 'axios'
import { resolvedConfig } from "./resolvedConfig.ts";

let axiosClient: AxiosInstance | null = null

export const initAxiosClient = (): AxiosInstance => {
  if (axiosClient) {
    return axiosClient
  }

  axiosClient = axios.create({
    baseURL: resolvedConfig.api.baseUrl,
  })

  axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
      throw error
    },
  )

  return axiosClient
}

export const getAxiosClient = (): AxiosInstance => {
  if (!axiosClient) {
    throw new Error('Axios client not initialized. Call initAxiosClient() first.')
  }

  return axiosClient
}