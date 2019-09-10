/**
 * @description: represent a k-line chart
 * @author: Nicky
 */
const RestClient = require('js-lib/rest-client');
const config = require('../config');
const host = 'www.pionex.com'
const port = 443;
class KLine {

    backtest(orders) {
        let totalProfit = 0, sellCount = 0, buyCount = 0;
        const initPrice = this.candles[0].open;
        function sellToPrice(orders, price) {
            let profit = 0;
            let start = orders.findIndex(order => !order.activate);
            while (start >= 1 && orders[start - 1].price <= price) {
                // complete sell order orders[start - 1]
                console.log(`sell operation @ ${orders[start - 1].price}`);
                totalProfit -= 0.0005;
                if (orders[start - 1].init) {
                    if (config.includeInitProfit) {
                        profit += (orders[start - 1].price - initPrice) / initPrice;
                    }
                    orders[start - 1].init = false;
                }
                else {
                    profit += (orders[start - 1].price - orders[start].price) / orders[start].price;
                }
                orders[start - 1].activate = false;
                orders[start].activate = true;
                orders[start].type = 'b';
                start--;
                sellCount++;
            }
            return profit;
        }
        function buyToPrice(orders, price) {
            let start = orders.findIndex(order => !order.activate);
            while (start <= orders.length - 2 && orders[start + 1].price >= price) {
                // complete buy order orders[start + 1]
                console.log(`buy operation @ ${orders[start + 1].price}`);
                totalProfit -= 0.0005;
                orders[start + 1].activate = false;
                orders[start].activate = true;
                orders[start].type = 's';
                start++;
                buyCount++;
            }
        }
        // const candle = {
        //     high: 178.67,
        //     low: 177.86,
        //     close: 178.29,
        //     open: 178.27
        // };
        this.candles.forEach(candle => {
            // ohlc estimation is conservative in bear market
            // in bull market, use olhc
            // buy or sell to open
            //console.log('1', orders);
            let start = orders.findIndex(order => !order.activate);
            if (start >= 1 && orders[start - 1].price <= candle.open) {
                totalProfit += sellToPrice(orders, candle.open);
            }
            else if (start < orders.length - 1 && orders[start + 1].price >= candle.open) {
                buyToPrice(orders, candle.open);
            }
            //console.log('2', orders, profit);
            // sell from open to high
            totalProfit += sellToPrice(orders, candle.high);
            //console.log('3', orders, profit);
            // buy from high to low
            buyToPrice(orders, candle.low);
            //console.log('4', orders);
            // sell from low to close
            totalProfit += sellToPrice(orders, candle.close);
            //console.log('5', orders, profit);
        });
        //console.log(this.candles);
        console.log('sell operation:', sellCount, 'buy operation:', buyCount);
        totalProfit /= orders.length + 1;
        console.log('period profit: ', totalProfit);
        return totalProfit;
    }
    init(start, end, pair, interval) {
        this.pair = pair.split('-');
        const path = '/kline/query_unite_candle_data?' + 
            `base=${this.pair[0]}&quote=${this.pair[1]}&market=pionex&` +
            `start=${start.unix()}&end=${end.unix()}&interval=${interval}&from=web`;
        
        return this.restClient.get(path, {}).then(d => {
            this.candles = d.history_price;
            return;   
        });
    }
    constructor() {
        this.restClient = new RestClient(host, port);
    }
 }
 module.exports = KLine;
