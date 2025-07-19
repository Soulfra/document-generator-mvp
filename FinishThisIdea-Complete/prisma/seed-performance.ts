/**
 * Performance Test Data Seeder
 * Creates test data for performance benchmarking
 */

import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function seedPerformanceData() {
  console.log('🌱 Seeding performance test data...');

  try {
    // Clean existing test data
    console.log('🧹 Cleaning existing performance test data...');
    await prisma.job.deleteMany({
      where: {
        OR: [
          { email: { contains: 'perf-test-' } },
          { email: { contains: '@performance.test' } }
        ]
      }
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: 'perf-test-' } },
          { email: { contains: '@performance.test' } }
        ]
      }
    });

    // Create test users for performance testing
    console.log('👥 Creating test users...');
    const testUsers = [];
    for (let i = 0; i < 100; i++) {
      const user = await prisma.user.create({
        data: {
          email: `perf-test-user-${i}@performance.test`,
          name: faker.person.fullName(),
          tier: faker.helpers.arrayElement(['FREE', 'PREMIUM', 'ENTERPRISE']),
          credits: faker.number.int({ min: 0, max: 1000 }),
          createdAt: faker.date.past({ years: 1 }),
        }
      });
      testUsers.push(user);
    }

    // Create test jobs for performance testing
    console.log('💼 Creating test jobs...');
    const jobStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'];
    const testJobs = [];

    for (let i = 0; i < 500; i++) {
      const user = faker.helpers.arrayElement(testUsers);
      const job = await prisma.job.create({
        data: {
          id: `perf-job-${i}`,
          email: user.email,
          status: faker.helpers.arrayElement(jobStatuses),
          originalFilename: faker.system.fileName(),
          cleanupFilename: faker.system.fileName(),
          downloadUrl: faker.internet.url(),
          cost: faker.number.float({ min: 0.1, max: 10.0, fractionDigits: 2 }),
          userId: user.id,
          createdAt: faker.date.past({ months: 6 }),
          updatedAt: faker.date.recent(),
          metadata: {
            linesProcessed: faker.number.int({ min: 100, max: 10000 }),
            issuesFixed: faker.number.int({ min: 0, max: 50 }),
            fileSize: faker.number.int({ min: 1024, max: 1048576 }),
            processingTime: faker.number.int({ min: 5, max: 300 }),
          }
        }
      });
      testJobs.push(job);
    }

    // Create test API keys for performance testing
    console.log('🔑 Creating test API keys...');
    for (let i = 0; i < 50; i++) {
      const user = faker.helpers.arrayElement(testUsers);
      await prisma.apiKey.create({
        data: {
          id: `perf-api-key-${i}`,
          name: `Performance Test Key ${i}`,
          key: `pk_test_${faker.string.alphanumeric(32)}`,
          userId: user.id,
          tier: user.tier,
          isActive: faker.datatype.boolean(),
          lastUsed: faker.date.recent(),
          createdAt: faker.date.past({ months: 3 }),
        }
      });
    }

    // Create test payments for performance testing
    console.log('💳 Creating test payments...');
    for (let i = 0; i < 200; i++) {
      const user = faker.helpers.arrayElement(testUsers);
      await prisma.payment.create({
        data: {
          id: `perf-payment-${i}`,
          stripePaymentIntentId: `pi_test_${faker.string.alphanumeric(24)}`,
          amount: faker.number.int({ min: 100, max: 10000 }), // cents
          currency: 'USD',
          status: faker.helpers.arrayElement(['succeeded', 'pending', 'failed']),
          userId: user.id,
          metadata: {
            source: 'performance_test',
            test_data: true,
          },
          createdAt: faker.date.past({ months: 6 }),
          updatedAt: faker.date.recent(),
        }
      });
    }

    // Create test uploads for performance testing
    console.log('📤 Creating test uploads...');
    for (let i = 0; i < 300; i++) {
      const user = faker.helpers.arrayElement(testUsers);
      await prisma.upload.create({
        data: {
          id: `perf-upload-${i}`,
          originalName: faker.system.fileName(),
          filename: faker.system.fileName(),
          mimeType: faker.helpers.arrayElement([
            'application/javascript',
            'text/typescript',
            'application/json',
            'text/plain',
            'application/zip'
          ]),
          size: faker.number.int({ min: 1024, max: 10485760 }),
          path: `/uploads/performance/${faker.system.fileName()}`,
          url: faker.internet.url(),
          userId: user.id,
          status: faker.helpers.arrayElement(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
          metadata: {
            originalSize: faker.number.int({ min: 1024, max: 10485760 }),
            compressedSize: faker.number.int({ min: 512, max: 5242880 }),
            processingTime: faker.number.int({ min: 1, max: 120 }),
          },
          createdAt: faker.date.past({ months: 3 }),
          updatedAt: faker.date.recent(),
        }
      });
    }

    console.log('✅ Performance test data seeded successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${testUsers.length} test users`);
    console.log(`   - ${testJobs.length} test jobs`);
    console.log(`   - 50 test API keys`);
    console.log(`   - 200 test payments`);
    console.log(`   - 300 test uploads`);

  } catch (error) {
    console.error('❌ Error seeding performance test data:', error);
    throw error;
  }
}

// Database performance tests
async function testDatabasePerformance() {
  console.log('🔍 Running database performance tests...');

  const startTime = Date.now();

  try {
    // Test 1: Complex query performance
    console.log('📊 Testing complex queries...');
    const complexQueryStart = Date.now();
    
    const userStats = await prisma.user.findMany({
      where: {
        email: { contains: '@performance.test' }
      },
      include: {
        jobs: {
          where: {
            status: 'COMPLETED'
          },
          take: 10
        },
        apiKeys: {
          where: {
            isActive: true
          }
        },
        payments: {
          where: {
            status: 'succeeded'
          },
          take: 5
        }
      },
      take: 20
    });

    const complexQueryTime = Date.now() - complexQueryStart;
    console.log(`   ✅ Complex query completed in ${complexQueryTime}ms (${userStats.length} users)`);

    // Test 2: Aggregation performance
    console.log('📈 Testing aggregations...');
    const aggregationStart = Date.now();

    const [jobCount, totalRevenue, avgJobTime] = await Promise.all([
      prisma.job.count({
        where: { email: { contains: '@performance.test' } }
      }),
      prisma.payment.aggregate({
        where: {
          user: { email: { contains: '@performance.test' } },
          status: 'succeeded'
        },
        _sum: { amount: true }
      }),
      prisma.job.aggregate({
        where: {
          email: { contains: '@performance.test' },
          status: 'COMPLETED'
        },
        _avg: { cost: true }
      })
    ]);

    const aggregationTime = Date.now() - aggregationStart;
    console.log(`   ✅ Aggregations completed in ${aggregationTime}ms`);
    console.log(`      - Total jobs: ${jobCount}`);
    console.log(`      - Total revenue: $${(totalRevenue._sum.amount || 0) / 100}`);
    console.log(`      - Avg job cost: $${avgJobTime._avg.cost || 0}`);

    // Test 3: Bulk operations performance
    console.log('🔄 Testing bulk operations...');
    const bulkStart = Date.now();

    const bulkUpdateResult = await prisma.job.updateMany({
      where: {
        email: { contains: '@performance.test' },
        status: 'PENDING'
      },
      data: {
        updatedAt: new Date()
      }
    });

    const bulkTime = Date.now() - bulkStart;
    console.log(`   ✅ Bulk update completed in ${bulkTime}ms (${bulkUpdateResult.count} records)`);

    const totalTime = Date.now() - startTime;
    console.log(`🎯 Database performance tests completed in ${totalTime}ms`);

    // Performance thresholds (adjust based on your requirements)
    const thresholds = {
      complexQuery: 500,  // 500ms
      aggregation: 200,   // 200ms
      bulkOperation: 300  // 300ms
    };

    if (complexQueryTime > thresholds.complexQuery) {
      console.warn(`⚠️  Complex query exceeded threshold: ${complexQueryTime}ms > ${thresholds.complexQuery}ms`);
    }

    if (aggregationTime > thresholds.aggregation) {
      console.warn(`⚠️  Aggregation exceeded threshold: ${aggregationTime}ms > ${thresholds.aggregation}ms`);
    }

    if (bulkTime > thresholds.bulkOperation) {
      console.warn(`⚠️  Bulk operation exceeded threshold: ${bulkTime}ms > ${thresholds.bulkOperation}ms`);
    }

    console.log('✅ Database performance tests passed!');

  } catch (error) {
    console.error('❌ Database performance test failed:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPerformanceData();
    await testDatabasePerformance();
  } catch (error) {
    console.error('❌ Performance seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Add faker as a dependency if running this script
const addFakerDependency = async () => {
  try {
    await import('@faker-js/faker');
  } catch (error) {
    console.log('📦 Installing @faker-js/faker for performance testing...');
    const { execSync } = require('child_process');
    execSync('npm install --save-dev @faker-js/faker', { stdio: 'inherit' });
  }
};

if (require.main === module) {
  addFakerDependency().then(() => main());
}

export { seedPerformanceData, testDatabasePerformance };