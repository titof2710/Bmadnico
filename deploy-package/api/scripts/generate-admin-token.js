"use strict";
/**
 * Generate Admin JWT Token for Testing
 * Creates a valid JWT token for the demo admin user
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-change-in-production';
// Match the seeded admin user
const payload = {
    sub: 'user-admin-demo',
    organizationId: 'demo-org-1',
    role: 'admin',
    email: 'admin@janus-demo.com',
    name: 'Admin Demo',
};
const token = jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
console.log('\n🔑 Admin JWT Token Generated\n');
console.log('═══════════════════════════════════════════════════════════════');
console.log('\nCopy this token and paste it in your browser console:\n');
console.log(`localStorage.setItem('jwt_token', '${token}')`);
console.log(`localStorage.setItem('user', '${JSON.stringify(JSON.stringify({
    userId: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    organizationId: payload.organizationId
}))}')`);
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('\nOr use this in test-users.html:\n');
console.log(`Token: ${token}`);
console.log('\n');
//# sourceMappingURL=generate-admin-token.js.map