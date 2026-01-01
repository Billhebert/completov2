/** Services Types */
export interface ExternalService { id: string; name: string; type: string; url: string; isHealthy: boolean; responseTime: number; lastCheckAt: string; }
export interface ServiceCall { id: string; serviceId: string; endpoint: string; method: string; duration: number; statusCode: number; success: boolean; timestamp: string; }
