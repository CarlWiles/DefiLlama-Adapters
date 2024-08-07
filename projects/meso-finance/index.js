const { function_view } = require("../helper/chain/aptos")
const methodologies = require("../helper/methodologies")

let _poolData

function getPoolData() {
  if (!_poolData) {
    _poolData = new Promise(async (resolve, reject) => {
      try {
        const poolAddresses = await getPoolAddresses()
        const poolInfos = await Promise.all(poolAddresses.map(getPoolInfo))
        resolve(poolInfos)
      } catch (e) { reject(e) }
    })
  }

  return _poolData

  async function getPoolAddresses() {
    const pools = await function_view({ functionStr: "0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7::meso::pools" })
    return pools[0]['data'].map(obj => { return { coin: obj.key, poolAddress: obj.value.inner } })
  }

  async function getPoolInfo(pool) {
    const poolInfo = await function_view({ functionStr: "0x68476f9d437e3f32fd262ba898b5e3ee0a23a1d586a6cf29a28add35f253f6f7::lending_pool::pool_info", type_arguments: [], args: [pool.poolAddress] })
    return { coin: pool.coin, poolSupply: poolInfo[0].total_reserves, totalDebt: poolInfo[0].total_debt }
  }
}

module.exports = {
  timetravel: false,
  methodology: methodologies.lendingMarket,
  aptos: {
    tvl: async (api) => {
      const poolInfos = await getPoolData()
      poolInfos.forEach(({ coin, poolSupply, }) => {
        api.add(coin, poolSupply)
      })
    },

    borrowed: async (api) => {
      const poolInfos = await getPoolData()
      poolInfos.forEach(({ coin, totalDebt }) => {
        api.add(coin, totalDebt)
      })
    }
  },
}