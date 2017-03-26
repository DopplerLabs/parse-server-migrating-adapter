import Promise from 'bluebird-settle'

/**
 MigratingAdapter
 Migrates files stored in other FileAdapter(s) to a new FileAdapter.
 All new writes will write to the main adapter.
 All reads will first read from the main adapter. If the file is not there,
 it will read from the old adapters and then store the results in the main adapter.
 */
export default class MigratingAdapter {

  /**
   * @param  {[FileAdapter]} mainAdapter The new adapter to use
   * @param  {[array]} oldAdapters The previous adapters
   */
  constructor(mainAdapter, oldAdapters) {
    this.mainAdapter = mainAdapter
    this.oldAdapters = oldAdapters

    if (!mainAdapter) {
      throw new Error('Main adapter required')
    }

    if (!oldAdapters || oldAdapters.length === 0) {
      throw new Error('At least one old adapter is required')
    }
  }

  // For a given config object, filename, and data, store a file
  // Returns a promise
  createFile(filename, data) {
    return this.mainAdapter.createFile(filename, data)
  }

  deleteFile(filename) {
    // Attempt a delete from all stores:
    const adapters = [this.mainAdapter].concat(this.oldAdapters)
    const promises = adapters.map((adapter) => {
      return Promise.resolve(adapter.deleteFile(filename))
    })

    return Promise.settle(promises)
      .then((results) => {
        for (const result of results) {
          if (result.isFulfilled()) {
            return Promise.resolve(result.value())
          }
        }

        // None were resolved
        return Promise.reject(results[0].reason())
      })
  }

  getFileData(filename) {
    return this.mainAdapter.getFileData(filename)
    .catch(err => {
      const promises = this.oldAdapters.map((adapter) => {
        return Promise.resolve(adapter.getFileData(filename))
      })

      return Promise.any(promises)
      .then(result => {
        return this.createFile(filename, result)
      }).catch(() => {
        return err
      })
    })
  }

  getFileLocation(config, filename) {
    return this.mainAdapter.getFileLocation(config, filename)
  }

  // TODO: Handle file streams
  // getFileStream(filename) { }
}
