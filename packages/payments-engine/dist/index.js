"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsEngineModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stellar_service_1 = require("./stellar.service");

let PaymentsEngineModule = class PaymentsEngineModule {};
PaymentsEngineModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
        ],
        providers: [stellar_service_1.StellarService],
        exports: [stellar_service_1.StellarService],
    })
], PaymentsEngineModule);
exports.PaymentsEngineModule = PaymentsEngineModule;
