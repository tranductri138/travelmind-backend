# Context: Auth — JWT, Passport, Guards

## Files

```
src/modules/auth/
├── auth.module.ts          # Đăng ký APP_GUARD (JwtAuthGuard, RolesGuard)
├── auth.controller.ts      # 4 routes
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts         # Access token verify
│   ├── jwt-refresh.strategy.ts # Refresh token verify
│   └── local.strategy.ts       # Email+password login
└── dto/
    ├── register.dto.ts         # email, password, firstName, lastName
    ├── login.dto.ts
    └── token-response.dto.ts
```

## Routes

| Method | Path | Guard | Notes |
|--------|------|-------|-------|
| POST | `/api/auth/register` | @Public | Trả token pair + emit `user.registered` |
| POST | `/api/auth/login` | @Public + LocalStrategy | |
| POST | `/api/auth/refresh` | JwtRefreshStrategy | Rotate tokens |
| POST | `/api/auth/logout` | JWT | Xóa refreshToken trong DB |

## Token Flow

- **Access Token** (15m): payload `{ sub: userId, email, role }`, ký bằng `JWT_ACCESS_SECRET`
- **Refresh Token** (7d): lưu dạng bcrypt hash trong `user.refreshToken`
- **Refresh**: verify hash match → cấp token mới → invalidate token cũ
- **Logout**: set `user.refreshToken = null`

## Guards (src/shared/guards/)

```typescript
// JwtAuthGuard — APP_GUARD, chạy mọi route
canActivate(context) {
  if (this.reflector.get(IS_PUBLIC_KEY, context.getHandler())) return true;
  return super.canActivate(context); // Passport JWT verify
}

// RolesGuard — APP_GUARD, chạy mọi route
canActivate(context) {
  const roles = this.reflector.get(ROLES_KEY, context.getHandler());
  if (!roles) return true;
  return roles.includes(context.switchToHttp().getRequest().user.role);
}
```

| Kết hợp | Kết quả |
|---------|---------|
| Không decorator | Cần JWT, mọi role |
| `@Public()` | Không cần JWT |
| `@Roles('ADMIN')` | Cần JWT + phải là ADMIN |
| `@Auth('ADMIN','HOTEL_OWNER')` | Cần JWT + một trong các role |
