import sinon from 'sinon'
import test from 'ava'
import MigratingAdapter from '../src'

class StubAdapter {
  createFile(filename, data) { }
  deleteFile(filename) { }
  getFileData(filename) { }
  getFileLocation(config, filename) { }
}

test.beforeEach((t) => {
  t.context.sandbox = sinon.sandbox.create()
  t.context.mainAdapter = new StubAdapter()
  t.context.oldAdapters = [new StubAdapter(), new StubAdapter()]
  t.context.migratingAdapter = new MigratingAdapter(
    t.context.mainAdapter, t.context.oldAdapters)
})

test.afterEach.always((t) => {
  t.context.sandbox.restore()
})

test('createFile#createsInMainAdapter', t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const createFileSpy = sandbox.spy(t.context.mainAdapter, 'createFile')

  migratingAdapter.createFile('foo', 'bar')
  t.true(createFileSpy.calledOnce)
  t.true(createFileSpy.calledWith('foo', 'bar'))
})

test('getFileData#returnsFromMainAdapter', t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const mainGetFileStub = sandbox.stub(t.context.mainAdapter, 'getFileData').resolves('myData')
  const oldGetFileSpy = sandbox.spy(t.context.oldAdapters[0], 'getFileData')

  migratingAdapter.getFileData('foo')
  t.true(mainGetFileStub.calledOnce)
  t.true(mainGetFileStub.calledWith('foo'))
  t.true(oldGetFileSpy.notCalled)
})

test('getFileData#getsFromOldAdapters', async t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  sandbox.stub(t.context.mainAdapter, 'getFileData').rejects()
  const oldStubs = [
    sandbox.stub(t.context.oldAdapters[0], 'getFileData').rejects(),
    sandbox.stub(t.context.oldAdapters[1], 'getFileData').resolves('myData')
  ]

  const fileData = await migratingAdapter.getFileData('foo')
  t.is(fileData, 'myData')

  for (const oldStub of oldStubs) {
    t.true(oldStub.calledOnce)
    t.true(oldStub.calledWith('foo'))
  }
})

test('getFileData#storesToMainAdapter', async t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const createFileSpy = sandbox.spy(migratingAdapter, 'createFile')
  sandbox.stub(t.context.mainAdapter, 'getFileData').rejects()
  sandbox.stub(t.context.oldAdapters[0], 'getFileData').resolves('myData')

  await migratingAdapter.getFileData('foo')

  t.true(createFileSpy.calledOnce)
  t.true(createFileSpy.calledWith('foo', 'myData'))
})

test('getFileData#throwsIfNotFound', async t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const rejectingError = { err: 'Not Found' }
  sandbox.stub(t.context.mainAdapter, 'getFileData').rejects(rejectingError)
  sandbox.stub(t.context.oldAdapters[0], 'getFileData').rejects()
  sandbox.stub(t.context.oldAdapters[1], 'getFileData').rejects()

  try {
    await migratingAdapter.getFileData('foo')
  } catch (err) {
    t.is(err, rejectingError)
  }
})

test('getFileLocation#returnsMainAdapterLocation', t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  sandbox.stub(t.context.mainAdapter, 'getFileLocation').returns('mainFileLocation')

  t.is(migratingAdapter.getFileLocation({}, 'foo'), 'mainFileLocation')
})

test('deleteFile#deletesFromAllAdapters', async t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const deleteStubs = [
    sandbox.stub(t.context.mainAdapter, 'deleteFile').resolves(),
    sandbox.stub(t.context.oldAdapters[0], 'deleteFile').rejects(),
    sandbox.stub(t.context.oldAdapters[1], 'deleteFile').resolves()
  ]

  await migratingAdapter.deleteFile('foo')
  for (const stub of deleteStubs) {
    t.true(stub.calledOnce)
    t.true(stub.calledWith('foo'))
  }
})

test('deleteFile#throwsIfNotDeletedFromAnyAdapter', async t => {
  const migratingAdapter = t.context.migratingAdapter
  const sandbox = t.context.sandbox

  const rejectingError = { err: 'Not Found' }
  sandbox.stub(t.context.mainAdapter, 'deleteFile').rejects(rejectingError)
  sandbox.stub(t.context.oldAdapters[0], 'deleteFile').rejects()
  sandbox.stub(t.context.oldAdapters[1], 'deleteFile').rejects()

  try {
    await migratingAdapter.deleteFile('foo')
  } catch (err) {
    t.is(err, rejectingError)
  }
})
