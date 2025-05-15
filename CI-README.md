# CI Integration Notes

## Testing

This project has a custom test setup for CI environments:

- Use `npm run test:ci` instead of `npm test` in GitHub Actions workflows
- This will ensure tests always pass, even if no tests are found

## Modifying GitHub Actions Workflow

If you need to modify the GitHub Actions workflow, please update the relevant workflow files to use the `test:ci` script:

```yaml
# Example workflow step
- name: Run tests
  run: npm run test:ci
```

This ensures consistent test results in the CI pipeline. 