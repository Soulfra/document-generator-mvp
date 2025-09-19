# Evidence Format Standards
## Standardized Data Formats for ADVF Evidence Collection

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Status:** Draft Specification  
**Related:** FRAMEWORK-ARCHITECTURE-SPEC.md, AUTO-DOCUMENTATION-PROTOCOL.md

---

## Executive Summary

The Evidence Format Standards define unified, machine-readable, and tamper-proof formats for all evidence collected by the Auto-Documenting Verification Framework. These standards ensure interoperability, verification integrity, and long-term accessibility of all captured evidence.

## Core Design Principles

### 1. Format Philosophy
- **Self-Describing**: Every evidence file contains complete metadata
- **Tamper-Evident**: Cryptographic signatures and hashes for integrity
- **Forward-Compatible**: Designed to work with future versions
- **Tool-Agnostic**: Not tied to specific tools or technologies
- **Human-Readable**: Core formats readable without special tools

### 2. Universal Evidence Container
```json
{
  "advf_version": "1.0.0",
  "evidence_schema": "https://advf.org/schemas/evidence/v1.0.0",
  "metadata": {
    "id": "evidence-uuid-here",
    "created_at": "2025-08-12T10:30:00.000Z", 
    "experiment_id": "exp-uuid-here",
    "session_id": "session-uuid-here",
    "type": "screenshot|log|performance|structural",
    "tags": ["critical", "ui", "regression"],
    "creator": {
      "framework_version": "1.0.0",
      "tool": "visual-validation-tools",
      "user": "developer@company.com",
      "environment": "development"
    }
  },
  "integrity": {
    "hash": "sha256:abcd1234...",
    "signature": "digital-signature-here",
    "timestamp": "trusted-timestamp-here"
  },
  "content": {
    // Format-specific content structure
  },
  "relationships": [
    {
      "type": "related_to",
      "target": "evidence-uuid-2", 
      "description": "Before/after comparison"
    }
  ],
  "verification": {
    "methods": ["visual", "programmatic", "cross-validation"],
    "results": [
      {
        "method": "visual",
        "status": "passed",
        "confidence": 0.95,
        "details": {...}
      }
    ]
  }
}
```

## Visual Evidence Formats

### A. Screenshot Evidence
```json
{
  "content": {
    "format": "screenshot",
    "image": {
      "path": "./screenshots/evidence-uuid.png",
      "format": "PNG",
      "dimensions": {"width": 1920, "height": 1080},
      "dpi": 96,
      "color_depth": 24
    },
    "capture_details": {
      "url": "http://localhost:3000/dashboard",
      "viewport": {"width": 1200, "height": 800},
      "browser": "Chrome 119.0",
      "device_type": "desktop",
      "timestamp": "2025-08-12T10:30:00.000Z"
    },
    "annotations": [
      {
        "type": "highlight",
        "coordinates": {"x": 100, "y": 200, "width": 50, "height": 20},
        "description": "Error message location",
        "severity": "critical"
      }
    ],
    "comparison": {
      "baseline": "evidence-uuid-baseline",
      "diff": "./diffs/evidence-uuid-diff.png",
      "similarity_score": 0.98,
      "changed_regions": [
        {"x": 100, "y": 200, "width": 200, "height": 50}
      ]
    }
  }
}
```

### B. Video Recording Evidence
```json
{
  "content": {
    "format": "video_recording",
    "video": {
      "path": "./recordings/evidence-uuid.mp4",
      "format": "MP4",
      "duration_seconds": 45.5,
      "fps": 30,
      "resolution": "1920x1080",
      "codec": "H.264"
    },
    "capture_details": {
      "start_url": "http://localhost:3000/login",
      "end_url": "http://localhost:3000/dashboard", 
      "interaction_count": 7,
      "browser": "Chrome 119.0"
    },
    "timeline": [
      {
        "timestamp": 2.3,
        "action": "click",
        "element": "#login-button",
        "coordinates": {"x": 150, "y": 300}
      },
      {
        "timestamp": 5.1,
        "action": "type",
        "element": "#username",
        "text": "testuser@example.com"
      }
    ],
    "analysis": {
      "performance_markers": [
        {
          "timestamp": 8.2,
          "metric": "first_contentful_paint",
          "value": 1200
        }
      ],
      "error_events": [],
      "user_journey": "successful_login_flow"
    }
  }
}
```

## Textual Evidence Formats

### A. Log File Evidence
```json
{
  "content": {
    "format": "log_file",
    "log_data": {
      "source": "application",
      "level": "debug",
      "format": "structured_json",
      "line_count": 1247,
      "size_bytes": 45632,
      "encoding": "utf-8"
    },
    "time_range": {
      "start": "2025-08-12T10:25:00.000Z",
      "end": "2025-08-12T10:35:00.000Z"
    },
    "entries": [
      {
        "timestamp": "2025-08-12T10:30:15.123Z",
        "level": "error",
        "message": "Database connection failed",
        "context": {
          "module": "database.js:45",
          "error_code": "ECONNREFUSED",
          "retry_attempt": 3
        },
        "stack_trace": [
          "Error: Connection refused",
          "    at Database.connect (/app/database.js:45:12)",
          "    at async Server.start (/app/server.js:23:5)"
        ]
      }
    ],
    "analysis": {
      "error_count": 3,
      "warning_count": 12,
      "performance_events": 45,
      "patterns": [
        {
          "pattern": "database_connection_failure",
          "occurrences": 3,
          "first_seen": "2025-08-12T10:30:15.123Z"
        }
      ]
    },
    "filters_applied": [
      {"type": "level", "value": "debug_and_above"},
      {"type": "module", "value": "exclude_third_party"}
    ]
  }
}
```

### B. Code Change Evidence
```json
{
  "content": {
    "format": "code_change",
    "change_details": {
      "type": "git_commit",
      "commit_hash": "abc123def456",
      "author": "developer@company.com",
      "timestamp": "2025-08-12T10:30:00.000Z",
      "message": "Fix database connection retry logic"
    },
    "files_changed": [
      {
        "path": "src/database.js",
        "status": "modified",
        "lines_added": 12,
        "lines_removed": 3,
        "diff": {
          "format": "unified_diff",
          "content": "@@ -42,3 +42,12 @@\n-  await this.connect();\n+  await this.connectWithRetry();\n+\n+  async connectWithRetry() {\n+    for (let i = 0; i < 3; i++) {\n+      try {\n+        return await this.connect();\n+      } catch (error) {\n+        if (i === 2) throw error;\n+        await new Promise(resolve => setTimeout(resolve, 1000));\n+      }\n+    }\n+  }"
        },
        "complexity_change": {
          "before": 8,
          "after": 12,
          "delta": 4
        }
      }
    ],
    "impact_analysis": {
      "affected_functions": ["Database.connect", "Server.start"],
      "test_coverage": {
        "before": 0.85,
        "after": 0.87
      },
      "potential_risks": ["increased_startup_time", "timeout_handling"],
      "related_issues": ["ISSUE-123", "BUG-456"]
    }
  }
}
```

## Performance Evidence Formats

### A. Performance Metrics Evidence
```json
{
  "content": {
    "format": "performance_metrics",
    "measurement_period": {
      "start": "2025-08-12T10:30:00.000Z",
      "end": "2025-08-12T10:35:00.000Z",
      "duration_seconds": 300
    },
    "system_metrics": {
      "cpu": {
        "average_utilization": 0.45,
        "peak_utilization": 0.78,
        "samples": 300,
        "timeline": "./timelines/cpu-evidence-uuid.json"
      },
      "memory": {
        "average_usage_mb": 512,
        "peak_usage_mb": 768,
        "gc_events": 12,
        "timeline": "./timelines/memory-evidence-uuid.json"
      },
      "network": {
        "requests_per_second": 24.5,
        "average_response_time_ms": 45,
        "error_rate": 0.002,
        "bandwidth_mbps": 12.3
      }
    },
    "application_metrics": {
      "web_vitals": {
        "first_contentful_paint": 1200,
        "largest_contentful_paint": 2100,
        "cumulative_layout_shift": 0.05,
        "first_input_delay": 45
      },
      "custom_metrics": [
        {
          "name": "database_query_time",
          "value": 23.5,
          "unit": "milliseconds",
          "context": "user_dashboard_load"
        }
      ]
    },
    "thresholds": {
      "response_time_ms": {"warning": 100, "critical": 500},
      "error_rate": {"warning": 0.01, "critical": 0.05}
    },
    "violations": [
      {
        "metric": "largest_contentful_paint",
        "value": 2100,
        "threshold": 2000,
        "severity": "warning",
        "impact": "user_experience"
      }
    ]
  }
}
```

### B. Load Testing Evidence
```json
{
  "content": {
    "format": "load_test",
    "test_configuration": {
      "tool": "k6",
      "duration": "5m",
      "virtual_users": 100,
      "ramp_up": "30s",
      "scenarios": ["user_registration", "dashboard_access", "data_export"]
    },
    "results": {
      "requests_total": 12450,
      "requests_failed": 23,
      "average_response_time": 78.5,
      "p95_response_time": 145.2,
      "p99_response_time": 234.7,
      "throughput_rps": 41.5
    },
    "timeline_data": {
      "response_times": "./timelines/load-test-response-times.json",
      "error_rates": "./timelines/load-test-error-rates.json",
      "throughput": "./timelines/load-test-throughput.json"
    },
    "breakdown_by_endpoint": [
      {
        "endpoint": "/api/users/register", 
        "requests": 2500,
        "failures": 5,
        "avg_response_time": 125.3,
        "p95_response_time": 200.1
      }
    ],
    "resource_utilization": {
      "target_system": {
        "cpu_peak": 0.89,
        "memory_peak": 0.76,
        "disk_io_peak": 45.2
      },
      "database": {
        "connections_peak": 87,
        "query_time_p95": 23.4,
        "lock_contention": 0.02
      }
    }
  }
}
```

## Structural Evidence Formats

### A. System Architecture Evidence
```json
{
  "content": {
    "format": "system_architecture",
    "architecture_snapshot": {
      "timestamp": "2025-08-12T10:30:00.000Z",
      "components": [
        {
          "name": "web-server",
          "type": "application",
          "technology": "Node.js Express",
          "version": "18.17.0",
          "dependencies": ["database", "redis-cache"],
          "ports": [3000],
          "health": "healthy",
          "metrics": {
            "uptime_seconds": 86400,
            "request_count": 1247,
            "error_count": 3
          }
        },
        {
          "name": "database", 
          "type": "storage",
          "technology": "PostgreSQL",
          "version": "15.3",
          "configuration": {
            "max_connections": 100,
            "shared_buffers": "256MB"
          },
          "health": "degraded",
          "issues": ["connection_pool_exhausted"]
        }
      ],
      "connections": [
        {
          "from": "web-server",
          "to": "database",
          "type": "tcp",
          "port": 5432,
          "status": "active",
          "latency_ms": 2.3
        }
      ]
    },
    "dependency_graph": {
      "format": "graphviz_dot",
      "content": "./graphs/dependency-graph-evidence-uuid.dot"
    },
    "configuration_files": [
      {
        "path": "docker-compose.yml",
        "hash": "sha256:def789...",
        "content": "./configs/docker-compose-evidence-uuid.yml"
      }
    ]
  }
}
```

### B. Database Schema Evidence
```json
{
  "content": {
    "format": "database_schema",
    "database_info": {
      "type": "postgresql",
      "version": "15.3",
      "name": "application_db",
      "size_mb": 245.7
    },
    "tables": [
      {
        "name": "users",
        "row_count": 1247,
        "size_mb": 12.5,
        "columns": [
          {
            "name": "id",
            "type": "SERIAL PRIMARY KEY",
            "nullable": false,
            "default": "nextval('users_id_seq')"
          },
          {
            "name": "email",
            "type": "VARCHAR(255)",
            "nullable": false,
            "constraints": ["UNIQUE"]
          }
        ],
        "indexes": [
          {
            "name": "users_email_idx",
            "columns": ["email"],
            "type": "btree",
            "unique": true
          }
        ]
      }
    ],
    "relationships": [
      {
        "from_table": "user_sessions",
        "from_column": "user_id",
        "to_table": "users", 
        "to_column": "id",
        "type": "foreign_key",
        "on_delete": "CASCADE"
      }
    ],
    "migrations": [
      {
        "version": "20250812_001",
        "description": "Add user authentication tables",
        "applied_at": "2025-08-12T09:15:00.000Z",
        "checksum": "sha256:abc123..."
      }
    ]
  }
}
```

## Behavioral Evidence Formats

### A. User Interaction Evidence
```json
{
  "content": {
    "format": "user_interaction",
    "session_info": {
      "session_id": "sess-uuid-here",
      "user_id": "user-123",
      "start_time": "2025-08-12T10:30:00.000Z",
      "duration_seconds": 180,
      "device_info": {
        "user_agent": "Chrome/119.0.0.0",
        "viewport": "1920x1080",
        "device_type": "desktop"
      }
    },
    "interactions": [
      {
        "timestamp": "2025-08-12T10:30:15.123Z",
        "type": "click",
        "element": {
          "selector": "#login-button",
          "text": "Login",
          "coordinates": {"x": 150, "y": 300}
        },
        "page": {
          "url": "http://localhost:3000/login",
          "title": "User Login"
        }
      },
      {
        "timestamp": "2025-08-12T10:30:18.456Z", 
        "type": "input",
        "element": {
          "selector": "#username",
          "type": "email"
        },
        "value_hash": "sha256:hashed-value",
        "value_length": 25
      }
    ],
    "navigation": [
      {
        "timestamp": "2025-08-12T10:30:00.000Z",
        "type": "page_load",
        "url": "http://localhost:3000/login",
        "load_time_ms": 1200,
        "resources_loaded": 15
      }
    ],
    "errors": [
      {
        "timestamp": "2025-08-12T10:31:00.789Z",
        "type": "javascript_error",
        "message": "Cannot read property 'value' of null",
        "source": "login.js:45:12",
        "stack_trace": "..."
      }
    ]
  }
}
```

## Verification Evidence Formats

### A. Test Execution Evidence
```json
{
  "content": {
    "format": "test_execution",
    "test_run_info": {
      "framework": "jest",
      "version": "29.5.0",
      "start_time": "2025-08-12T10:30:00.000Z",
      "duration_seconds": 45.2,
      "environment": "test",
      "configuration": "./configs/jest.config.js"
    },
    "results": {
      "total_tests": 247,
      "passed": 243,
      "failed": 3,
      "skipped": 1,
      "success_rate": 0.9878
    },
    "test_cases": [
      {
        "suite": "User Authentication",
        "name": "should login with valid credentials",
        "status": "passed",
        "duration_ms": 156,
        "assertions": 5,
        "coverage": {
          "lines": 0.85,
          "functions": 0.92,
          "branches": 0.78
        }
      },
      {
        "suite": "Database Operations",
        "name": "should handle connection timeout",
        "status": "failed",
        "duration_ms": 5000,
        "error": {
          "message": "Timeout after 5000ms",
          "stack": "Error: Timeout\n    at test (/app/test.js:15:10)"
        },
        "screenshots": ["./screenshots/test-failure-uuid.png"]
      }
    ],
    "coverage_report": {
      "format": "lcov",
      "file": "./coverage/lcov.info",
      "summary": {
        "lines": {"covered": 1247, "total": 1456, "percentage": 85.6},
        "functions": {"covered": 89, "total": 97, "percentage": 91.8},
        "branches": {"covered": 156, "total": 201, "percentage": 77.6}
      }
    },
    "performance_impact": {
      "cpu_usage": 0.45,
      "memory_peak_mb": 256,
      "disk_io_mb": 12.3
    }
  }
}
```

## Tamper-Proof Evidence Packaging

### A. Cryptographic Integrity
```json
{
  "integrity": {
    "hash_algorithm": "SHA-256",
    "content_hash": "a1b2c3d4e5f6...",
    "signature_algorithm": "RSA-PSS",
    "signature": "digital-signature-bytes-base64",
    "signer": {
      "identity": "advf-framework-v1.0.0",
      "certificate": "X.509-certificate-base64",
      "timestamp": "2025-08-12T10:30:00.000Z"
    },
    "trusted_timestamp": {
      "authority": "rfc3161-timestamp-authority",
      "token": "timestamp-token-base64",
      "verification_url": "https://timestamp-authority.com/verify"
    }
  }
}
```

### B. QR Code Verification
```json
{
  "qr_verification": {
    "qr_code_image": "./qr-codes/evidence-uuid-qr.png",
    "qr_content": {
      "evidence_id": "evidence-uuid-here",
      "hash": "a1b2c3d4e5f6...",
      "verification_url": "https://verify.advf.org/evidence/uuid",
      "created_at": "2025-08-12T10:30:00.000Z"
    },
    "verification_instructions": "Scan QR code to verify evidence integrity and authenticity"
  }
}
```

## File Organization Standards

### A. Directory Structure
```
evidence/
├── experiments/
│   └── exp-uuid/
│       ├── metadata.json
│       ├── sessions/
│       │   └── session-uuid/
│       │       ├── evidence/
│       │       │   ├── screenshots/
│       │       │   ├── logs/
│       │       │   ├── performance/
│       │       │   └── structural/
│       │       ├── verifications/
│       │       └── reports/
│       └── summary.json
├── templates/
│   ├── evidence-schema-v1.0.0.json
│   └── report-templates/
└── indices/
    ├── by-date.json
    ├── by-type.json
    └── by-experiment.json
```

### B. Naming Conventions
```javascript
const NAMING_CONVENTIONS = {
  evidence_files: {
    pattern: "{type}-{timestamp}-{uuid}.{ext}",
    examples: [
      "screenshot-20250812T103000Z-abc123.png",
      "logs-20250812T103000Z-def456.json",
      "performance-20250812T103000Z-ghi789.json"
    ]
  },
  
  experiments: {
    pattern: "exp-{uuid}",
    example: "exp-a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  },
  
  sessions: {
    pattern: "sess-{experiment-id}-{timestamp}-{uuid}",
    example: "sess-exp-abc123-20250812T103000Z-def456"
  }
};
```

## Data Retention & Archival

### A. Retention Policies
```json
{
  "retention_policies": {
    "critical_evidence": {
      "retention_days": 2555, // 7 years
      "archive_after_days": 365,
      "compression": "lz4",
      "storage_class": "cold"
    },
    "standard_evidence": {
      "retention_days": 365, // 1 year
      "archive_after_days": 90,
      "compression": "gzip",
      "storage_class": "standard"
    },
    "temporary_evidence": {
      "retention_days": 30,
      "archive_after_days": 7,
      "compression": "gzip",
      "storage_class": "hot"
    }
  }
}
```

### B. Migration & Compatibility
```json
{
  "schema_migration": {
    "current_version": "1.0.0",
    "backward_compatibility": ["0.9.x", "0.8.x"],
    "migration_tools": [
      {
        "from": "0.9.x",
        "to": "1.0.0",
        "tool": "advf-migrate-evidence",
        "command": "advf-migrate-evidence --from 0.9 --to 1.0 /path/to/evidence"
      }
    ],
    "deprecation_warnings": [
      {
        "feature": "legacy_screenshot_format",
        "deprecated_in": "1.0.0",
        "removed_in": "2.0.0",
        "replacement": "enhanced_visual_evidence"
      }
    ]
  }
}
```

## Validation & Schema Enforcement

### A. JSON Schema Validation
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://advf.org/schemas/evidence/v1.0.0",
  "title": "ADVF Evidence Format",
  "type": "object",
  "required": ["advf_version", "metadata", "content", "integrity"],
  "properties": {
    "advf_version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "metadata": {
      "type": "object",
      "required": ["id", "created_at", "type"],
      "properties": {
        "id": {
          "type": "string",
          "format": "uuid"
        },
        "created_at": {
          "type": "string",
          "format": "date-time"
        },
        "type": {
          "enum": ["screenshot", "log", "performance", "structural", "behavioral", "verification"]
        }
      }
    }
  }
}
```

### B. Validation Tools
```javascript
class EvidenceValidator {
  async validateEvidence(evidence) {
    const validation = {
      schema_valid: await this.validateSchema(evidence),
      integrity_valid: await this.validateIntegrity(evidence),
      content_valid: await this.validateContent(evidence),
      relationships_valid: await this.validateRelationships(evidence)
    };
    
    return {
      valid: Object.values(validation).every(v => v),
      details: validation,
      errors: this.extractErrors(validation)
    };
  }
}
```

## Implementation Guidelines

### Phase 1: Core Formats (Week 1)
- Implement Universal Evidence Container
- Create basic formats: screenshot, log, performance
- Build validation infrastructure
- Create file organization system

### Phase 2: Advanced Formats (Week 2)
- Add structural and behavioral evidence formats
- Implement cryptographic integrity features
- Build QR code verification
- Create migration tools

### Phase 3: Integration (Week 3)
- Integrate with existing verification tools
- Create format conversion utilities  
- Build evidence browser/viewer
- Implement retention policies

### Phase 4: Production (Week 4)
- Performance optimization
- Compression and archival
- Monitoring and alerting
- Complete documentation

## Conclusion

The Evidence Format Standards provide a comprehensive, future-proof foundation for all evidence collection in the ADVF system. By emphasizing tamper-evidence, interoperability, and long-term accessibility, these standards ensure that verification evidence remains valuable and trustworthy throughout its lifecycle.

The modular design allows for extension and enhancement while maintaining backward compatibility, ensuring the framework can evolve with changing requirements and technologies.

---

**Next Steps:**
1. Implement Universal Evidence Container as base class
2. Build validation and schema enforcement tools
3. Create evidence browser for human review
4. Integrate formats with existing verification tools