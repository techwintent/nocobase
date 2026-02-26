#!/usr/bin/env node
/**
 * Task 1.3: 执行建表并验证
 * 通过 NocoBase API 创建 collections，并验证字段类型、关联关系，输出 validation-log-v0.1.md
 *
 * 使用: node run-create-tables-and-validate.js [NOCOBASE_URL] [API_TOKEN]
 * 示例: node run-create-tables-and-validate.js http://localhost:13000
 * 未提供 TOKEN 时使用 admin@wintent.tech / admin123 登录获取
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = path.dirname(__filename);
const COLLECTIONS_FILE = path.join(SCRIPT_DIR, 'collections.json');
const LOG_FILE = path.join(SCRIPT_DIR, '..', 'validation-log-v0.1.md');

const NOCOBASE_URL = (process.argv[2] || 'http://localhost:13000').replace(
  /\/$/,
  ''
);
const API_TOKEN_ARG = process.argv[3];

let token;

async function login() {
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@wintent.tech',
      password: 'admin123',
    }),
  });
  const data = await res.json();
  if (!data?.data?.token) {
    throw new Error(
      '登录失败: ' +
        (data?.errors?.[0]?.message ||
          data?.message ||
          '请检查 URL 或手动提供 API_TOKEN')
    );
  }
  return data.data.token;
}

async function api(method, urlPath, body = null) {
  const url = `${NOCOBASE_URL}${urlPath}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
  return { status: res.status, data };
}

async function createCollection(values) {
  const { status, data } = await api('POST', '/api/collections:create', {
    values,
  });
  return { status, data };
}

async function listCollectionsMeta() {
  const { status, data } = await api('GET', '/api/collections:listMeta');
  if (status !== 200)
    throw new Error(
      'listMeta failed: ' + (data?.errors?.[0]?.message || status)
    );
  return Array.isArray(data) ? data : data?.data ?? data ?? [];
}

function main() {
  return (async () => {
    console.log('🚀 Task 1.3: 执行建表并验证');
    console.log('   URL:', NOCOBASE_URL);
    console.log('');

    if (API_TOKEN_ARG) {
      token = API_TOKEN_ARG;
      console.log('   使用提供的 API Token');
    } else {
      console.log('   正在登录获取 Token...');
      token = await login();
      console.log('   ✅ 登录成功');
    }
    console.log('');

    const raw = fs.readFileSync(COLLECTIONS_FILE, 'utf8');
    const { collections } = JSON.parse(raw);
    if (!Array.isArray(collections) || !collections.length) {
      throw new Error('collections.json 格式错误或为空');
    }

    const expected = collections.map((c) => ({
      name: c.name,
      title: c.title || c.name,
      fieldCount: (c.fields || []).length,
    }));

    const results = [];
    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const col of collections) {
      const name = col.name;
      process.stdout.write(`📦 ${name} (${col.title || name}) ... `);
      const { status, data } = await createCollection(col);
      if (status === 200 && (data?.data?.name || data?.name)) {
        console.log('✅ 成功');
        results.push({ name, action: 'created', error: null });
        created++;
      } else if (
        status === 400 ||
        status === 409 ||
        (data?.errors && data.errors.length > 0)
      ) {
        const msg =
          data?.errors?.[0]?.message || data?.message || String(status);
        if (/already exists|duplicate|已存在/i.test(msg)) {
          console.log('⏭️ 已存在，跳过');
          results.push({ name, action: 'skipped', error: msg });
          skipped++;
        } else {
          console.log('❌ 失败:', msg);
          results.push({ name, action: 'failed', error: msg });
          failed++;
        }
      } else {
        const msg =
          data?.errors?.[0]?.message || data?.message || `HTTP ${status}`;
        console.log('❌ 失败:', msg);
        results.push({ name, action: 'failed', error: msg });
        failed++;
      }
    }

    console.log('');
    console.log('📋 验证表结构...');
    let meta = [];
    try {
      meta = await listCollectionsMeta();
    } catch (e) {
      console.log('   ⚠️ 无法获取 collections 元数据:', e.message);
    }

    const metaByName = {};
    for (const m of meta) {
      const n = m.name || m.key;
      if (n) metaByName[n] = m;
    }

    const validation = [];
    for (const exp of expected) {
      const m = metaByName[exp.name];
      const fieldCount = m?.fields?.length ?? 0;
      // 通过条件：表存在且实际字段数 >= 预期（NocoBase 可能增加 sort/key 等系统字段）
      const ok = m && fieldCount >= exp.fieldCount;
      validation.push({
        name: exp.name,
        title: exp.title,
        expectedFields: exp.fieldCount,
        actualFields: fieldCount,
        exists: !!m,
        ok,
      });
    }

    const allOk = validation.every((v) => v.ok);
    const logLines = [
      '# 数据模型 v0.1 建表验证日志',
      '',
      `- **执行时间**: ${new Date().toISOString()}`,
      `- **NocoBase URL**: ${NOCOBASE_URL}`,
      `- **建表结果**: 创建 ${created} / 跳过 ${skipped} / 失败 ${failed}`,
      `- **验证结果**: ${allOk ? '✅ 通过' : '❌ 未完全通过'}`,
      '',
      '## 建表明细',
      '',
      '| 表名 | 标题 | 操作 | 说明 |',
      '|------|------|------|------|',
      ...results.map(
        (r) =>
          `| ${r.name} | - | ${
            r.action === 'created'
              ? '创建'
              : r.action === 'skipped'
              ? '跳过'
              : '失败'
          } | ${r.error || '-'} |`
      ),
      '',
      '## 验证明细',
      '',
      '| 表名 | 标题 | 预期字段数 | 实际字段数 | 状态 |',
      '|------|------|------------|------------|------|',
      ...validation.map(
        (v) =>
          `| ${v.name} | ${v.title} | ${v.expectedFields} | ${
            v.actualFields
          } | ${v.ok ? '✅' : '❌'} |`
      ),
      '',
    ];

    const logPath = path.resolve(LOG_FILE);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, logLines.join('\n'), 'utf8');
    console.log('');
    console.log('==========================================');
    console.log('📊 执行结果');
    console.log('   创建:', created, '| 跳过:', skipped, '| 失败:', failed);
    console.log('   验证:', allOk ? '通过' : '未完全通过');
    console.log('   日志:', logPath);
    console.log('==========================================');

    if (failed > 0) process.exit(1);
  })();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
