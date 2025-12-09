# Security Code Review Report

**Application:** Observe Entity Explorer
**Date:** 2025-12-09
**Reviewer:** Security Audit

## Executive Summary

This security review identified **17 security vulnerabilities** across the Observe Entity Explorer codebase, including 4 critical, 6 high, 5 medium, and 2 low severity issues. The most critical findings involve hardcoded secrets, disabled SSL certificate validation, and plaintext credential storage.

---

## Critical Severity Issues

### 1. Hardcoded API Token in Configuration
**File:** `appsettings.json:20`
**CWE:** CWE-798 (Use of Hard-coded Credentials)

```json
"Token": "ds1JTsjyaYAxDR8R9faN:qqeqfwWF5jUG2POBPl3_51uZnvA1okg8"
```

**Impact:** The telemetry token is exposed in source control and distribution packages. Attackers can use this token to send malicious telemetry data or potentially access the collector endpoint.

**Remediation:**
- Remove hardcoded tokens from configuration files
- Use environment variables or secure secret management (Azure Key Vault, AWS Secrets Manager, HashiCorp Vault)
- Add `appsettings.json` to `.gitignore` if it contains secrets
- Rotate the exposed token immediately

---

### 2. SSL Certificate Validation Disabled
**File:** `Connection/ObserveConnection.cs:2954, 3084`
**CWE:** CWE-295 (Improper Certificate Validation)

```csharp
httpClientHandler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;
```

**Impact:** This completely disables SSL certificate validation, making the application vulnerable to man-in-the-middle (MITM) attacks. Attackers can intercept and modify sensitive authentication tokens and API responses.

**Remediation:**
- Remove the `DangerousAcceptAnyServerCertificateValidator` callback
- If custom certificates are needed, implement proper certificate pinning
- For development only, use `#if DEBUG` conditional compilation

---

### 3. Plaintext Credentials Stored on Disk
**File:** `Controllers/CommonControllerMethods.cs:47-54, 67-72`
**CWE:** CWE-312 (Cleartext Storage of Sensitive Information)

```csharp
string authCacheFilePath = Path.Combine(authCacheFolderPath, "observe-entity-explorer.auth-cache.json");
File.WriteAllText(authCacheFilePath, JsonConvert.SerializeObject(allUsers, Formatting.Indented), Encoding.UTF8);
```

**Impact:** Authentication tokens are stored in plaintext in `~/.observe/observe-entity-explorer.auth-cache.json`. Anyone with filesystem access can steal these tokens.

**Remediation:**
- Encrypt credentials using DPAPI (Windows) or similar platform-specific encryption
- Use `System.Security.Cryptography.ProtectedData` for encryption
- Set restrictive file permissions (600 on Linux/Mac)
- Consider using the OS keychain/credential manager

---

### 4. Authentication Tokens Logged in Plaintext
**File:** `Controllers/ConnectionController.cs:312`
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

```csharp
logger.Info("currentUser.AuthToken={0}", currentUser.AuthToken);
```

**Impact:** Authentication tokens are written to log files, allowing anyone with log access to steal credentials.

**Remediation:**
- Remove all logging of authentication tokens
- If token logging is needed for debugging, mask all but the last 4 characters
- Implement log sanitization for sensitive fields

---

## High Severity Issues

### 5. Regular Expression Denial of Service (ReDoS)
**File:** `Controllers/SearchController.cs:121-131`
**CWE:** CWE-1333 (Inefficient Regular Expression Complexity)

```csharp
private bool StringMatches(string stringToSearch, string searchCriteria)
{
    foreach (Match match in Regex.Matches(stringToSearch, searchCriteria))
```

**Impact:** User-supplied search criteria is directly passed to `Regex.Matches()` without validation. Malicious regex patterns can cause catastrophic backtracking, consuming excessive CPU and causing denial of service.

**Remediation:**
- Implement regex timeout: `Regex.Matches(str, pattern, RegexOptions.None, TimeSpan.FromSeconds(1))`
- Validate/sanitize user input before using in regex
- Consider using simple string matching instead of regex
- Implement a whitelist of allowed regex patterns

---

### 6. Missing CSRF Protection
**Files:** All controllers and forms
**CWE:** CWE-352 (Cross-Site Request Forgery)

**Impact:** Forms do not include anti-forgery tokens. Attackers can craft malicious pages that perform actions on behalf of authenticated users.

**Remediation:**
- Add `[ValidateAntiForgeryToken]` attribute to all POST action methods
- Include `@Html.AntiForgeryToken()` in all forms
- Enable global anti-forgery validation in `Program.cs`:
```csharp
builder.Services.AddControllersWithViews(options => {
    options.Filters.Add(new AutoValidateAntiforgeryTokenAttribute());
});
```

---

### 7. Wildcard Host Header Allowed
**File:** `appsettings.json:16`
**CWE:** CWE-20 (Improper Input Validation)

```json
"AllowedHosts": "*"
```

**Impact:** Allows requests from any host, potentially enabling host header injection attacks.

**Remediation:**
- Restrict to specific allowed hosts: `"AllowedHosts": "localhost;yourdomain.com"`

---

### 8. Potential XSS via Html.Raw
**File:** `Views/Shared/_Layout.cshtml:33`
**CWE:** CWE-79 (Cross-site Scripting)

```cshtml
@Html.Raw(Model.CurrentUser)
```

**Impact:** If user display name contains malicious HTML/JavaScript, it will be rendered without encoding, leading to XSS.

**Remediation:**
- Replace `@Html.Raw()` with encoded output: `@Model.CurrentUser`
- If HTML formatting is needed, use a HTML sanitization library

---

### 9. No Session Timeout or Token Expiration Validation
**File:** `Controllers/CommonControllerMethods.cs:99`
**CWE:** CWE-613 (Insufficient Session Expiration)

```csharp
var cacheEntryOptions = new MemoryCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromHours(3));
```

**Impact:** User sessions remain valid for 3 hours without re-validation. Stolen tokens can be used indefinitely within this window.

**Remediation:**
- Implement token refresh mechanisms
- Validate token expiration on each request
- Reduce cache timeout or implement sliding expiration with activity checks

---

### 10. Sensitive Information in URL Query Parameters
**File:** Multiple views pass `userid` in query strings
**CWE:** CWE-598 (Use of GET Request Method With Sensitive Query Strings)

```cshtml
asp-route-userid="@currentUser.UniqueID"
```

**Impact:** User IDs in URLs are logged, cached by browsers, and may appear in referrer headers.

**Remediation:**
- Use POST requests or session storage for sensitive identifiers
- Avoid exposing internal IDs in URLs

---

## Medium Severity Issues

### 11. HTTPS Redirection Disabled
**File:** `Program.cs:88`
**CWE:** CWE-319 (Cleartext Transmission of Sensitive Information)

```csharp
//app.UseHttpsRedirection();
```

**Impact:** Application allows HTTP connections, transmitting sensitive data unencrypted.

**Remediation:**
- Uncomment `app.UseHttpsRedirection();`
- Configure HSTS headers properly

---

### 12. Verbose Logging Level
**File:** `appsettings.json:11`
**CWE:** CWE-532 (Insertion of Sensitive Information into Log File)

```json
"LogLevel": {
  "Default": "Trace"
```

**Impact:** Trace-level logging captures excessive detail that may include sensitive information.

**Remediation:**
- Set production logging to `Warning` or `Error`
- Use `Information` for development only
- Implement structured logging with redaction

---

### 13. External CDN Dependencies Without Subresource Integrity
**File:** `Views/Shared/_Layout.cshtml:11-28`
**CWE:** CWE-829 (Inclusion of Functionality from Untrusted Control Sphere)

```html
<script src="https://cdn.datatables.net/2.2.1/js/dataTables.min.js"></script>
```

**Impact:** If CDN is compromised, malicious scripts could be loaded. Only jQuery has SRI hash.

**Remediation:**
- Add `integrity` and `crossorigin` attributes to all external scripts
- Consider hosting static assets locally
- Use a CDN with security features (e.g., Cloudflare)

---

### 14. Password Regex Redaction May Miss Variations
**File:** `Connection/ObserveConnection.cs:3131-3133`
**CWE:** CWE-117 (Improper Output Neutralization for Logs)

```csharp
var pattern = "\"user_password\": \"(.*)\",";
requestBody = Regex.Replace(requestBody, pattern, "\"user_password\": \"****\",");
```

**Impact:** The regex pattern may not match all JSON variations (different spacing, no trailing comma, etc.), potentially logging passwords.

**Remediation:**
- Use JSON parsing to properly redact sensitive fields
- Implement a centralized logging sanitization layer

---

### 15. Unsafe Base64 Decoding Without Validation
**File:** `Controllers/DetailsController.cs:370`
**CWE:** CWE-20 (Improper Input Validation)

```csharp
id = Encoding.UTF8.GetString(Convert.FromBase64String(id));
```

**Impact:** Invalid Base64 input will cause an unhandled exception. No validation of the decoded content.

**Remediation:**
- Wrap in try-catch with proper error handling
- Validate decoded content before use
- Use `Convert.TryFromBase64String()` if available

---

## Low Severity Issues

### 16. Detailed Error Messages Exposed to Users
**Files:** Multiple controllers expose `ex.Message` to views
**CWE:** CWE-209 (Generation of Error Message Containing Sensitive Information)

```csharp
ViewData["ErrorMessage"] = ex.Message;
```

**Impact:** Internal error details may reveal system information to attackers.

**Remediation:**
- Display generic error messages to users
- Log detailed errors server-side only

---

### 17. Nullable Reference Types Disabled
**File:** `observe-entity-explorer.csproj:6`
**CWE:** CWE-476 (NULL Pointer Dereference)

```xml
<Nullable>disable</Nullable>
```

**Impact:** Increased risk of null reference exceptions and potential security issues.

**Remediation:**
- Enable nullable reference types: `<Nullable>enable</Nullable>`
- Address all nullable warnings

---

## Summary Table

| # | Severity | Issue | File | CWE |
|---|----------|-------|------|-----|
| 1 | Critical | Hardcoded API Token | appsettings.json:20 | CWE-798 |
| 2 | Critical | SSL Validation Disabled | ObserveConnection.cs:2954,3084 | CWE-295 |
| 3 | Critical | Plaintext Credential Storage | CommonControllerMethods.cs:47-72 | CWE-312 |
| 4 | Critical | Token Logged in Plaintext | ConnectionController.cs:312 | CWE-532 |
| 5 | High | ReDoS Vulnerability | SearchController.cs:121-131 | CWE-1333 |
| 6 | High | Missing CSRF Protection | All forms | CWE-352 |
| 7 | High | Wildcard Host Header | appsettings.json:16 | CWE-20 |
| 8 | High | XSS via Html.Raw | _Layout.cshtml:33 | CWE-79 |
| 9 | High | No Session Timeout | CommonControllerMethods.cs:99 | CWE-613 |
| 10 | High | Sensitive Data in URLs | Multiple views | CWE-598 |
| 11 | Medium | HTTPS Disabled | Program.cs:88 | CWE-319 |
| 12 | Medium | Verbose Logging | appsettings.json:11 | CWE-532 |
| 13 | Medium | CDN Without SRI | _Layout.cshtml:11-28 | CWE-829 |
| 14 | Medium | Password Redaction Issues | ObserveConnection.cs:3131 | CWE-117 |
| 15 | Medium | Unsafe Base64 Decoding | DetailsController.cs:370 | CWE-20 |
| 16 | Low | Detailed Error Messages | Multiple controllers | CWE-209 |
| 17 | Low | Nullable Types Disabled | csproj:6 | CWE-476 |

---

## Recommendations Priority

### Immediate (Critical):
1. Remove hardcoded tokens and rotate exposed credentials
2. Enable SSL certificate validation
3. Encrypt stored credentials
4. Remove token logging

### Short-term (High):
5. Fix ReDoS vulnerability with regex timeout
6. Implement CSRF protection
7. Restrict allowed hosts
8. Fix XSS issues

### Medium-term (Medium/Low):
9. Enable HTTPS redirection
10. Reduce logging verbosity in production
11. Add SRI to external scripts
12. Improve error handling

---

## Dependencies Audit

Current package versions appear relatively up-to-date. Recommend running:
```bash
dotnet list package --vulnerable
```

Regular dependency scanning should be implemented in CI/CD pipeline.
