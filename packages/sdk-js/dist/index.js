"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SdkModule = exports.SdkService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");

let SdkService = class SdkService {
    constructor(configService) {
        this.apiKey = configService.get('SDK_API_KEY');
        this.baseUrl = configService.get('SDK_BASE_URL', 'https://api.example.com');
    }
    async makeRequest(endpoint) {
        // Implementation
        return {};
    }
};
SdkService = __decorate([
    (0, common_1.Injectable)()
], SdkService);
exports.SdkService = SdkService;

let SdkModule = class SdkModule {};
SdkModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
        ],
        providers: [SdkService],
        exports: [SdkService],
    })
], SdkModule);
exports.SdkModule = SdkModule;
