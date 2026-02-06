# k6 Load Testing for SkillForge

Performance and load testing suite using [k6](https://k6.io/).

## Prerequisites

Install k6 on your machine:

```bash
# macOS
brew install k6

# Windows (Chocolatey)
choco install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Docker
docker pull grafana/k6
```

## Test Scripts

| Script | Purpose | Duration | Max VUs |
|--------|---------|----------|---------|
| `load-test.js` | Standard load test | ~8 min | 100 |
| `edge-functions-test.js` | Test AI & Edge Functions | ~5 min | 100 |
| `stress-test.js` | Find breaking point | ~23 min | 300 |

## Running Tests

### Basic Load Test (100 users)
```bash
k6 run load-test.js
```

### Edge Functions Test
```bash
k6 run edge-functions-test.js
```

### Stress Test (find limits)
```bash
k6 run stress-test.js
```

### With Custom Environment
```bash
k6 run -e BASE_URL=https://your-app.com -e SUPABASE_URL=https://your-project.supabase.co load-test.js
```

### Output to JSON
```bash
k6 run --out json=results.json load-test.js
```

### With Dashboard (Grafana Cloud)
```bash
K6_CLOUD_TOKEN=your_token k6 cloud load-test.js
```

## Understanding Results

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `http_req_duration` | Response time | p95 < 2s |
| `http_req_failed` | Failed request rate | < 5% |
| `http_reqs` | Requests per second | Higher = better |
| `vus` | Virtual users | Configured max |

### Sample Output
```
     ✓ homepage status is 200
     ✓ career_roles status is 200
     
     checks.........................: 98.50% ✓ 4925  ✗ 75
     http_req_duration..............: avg=245ms p(95)=890ms
     http_reqs......................: 5000   ~83/s
     vus............................: 100    max=100
```

## Scaling Recommendations

Based on test results:

| Users | Expected RPS | Infra Needed |
|-------|--------------|--------------|
| 100 | 50-100 | Current setup |
| 500 | 200-400 | Add Redis cache |
| 1000+ | 500+ | CDN + Load balancer |

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run k6 Load Test
  uses: grafana/k6-action@v0.3.1
  with:
    filename: k6/load-test.js
    flags: --out json=results.json
```

## Tips

1. **Start small**: Begin with 10-20 users, increase gradually
2. **Monitor backend**: Watch Supabase metrics during tests
3. **Test during low traffic**: Avoid testing in production peak hours
4. **Rate limits**: AI endpoints have rate limits, expect 429s under heavy load
5. **Realistic scenarios**: Add think time (`sleep()`) between actions
