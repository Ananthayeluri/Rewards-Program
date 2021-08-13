import React, { useState, useEffect } from "react";
import fetch from "./api/dataService";
import ReactTable from "react-table";
import "./App.css";
import "react-table/react-table.css";
import "bootstrap/dist/css/bootstrap.min.css";
import _ from "lodash";

function calculateResults(incomingData) {
  // Calculate points per transaction

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const pointsPerTransaction = incomingData.map((transaction) => {
    let points = 0;
    let over100 = transaction.amt - 100;

    if (transaction.amt <= 100) {
      points = (transaction.amt - 50) * 1; // Our points are > 50 but < 100 so, plus 1 point for every dollar spent over $50 in each transaction
    }
    if (transaction.amt > 100) {
      points = over100 * 2 + 50; // We calculate every dollar over 100 as * 2 points then add 50 since we are over 100
    }
    if (transaction.amt <= 50) {
      points = 0;
    }
    const month = new Date(transaction.transactionDt).getMonth();
    return { ...transaction, points, month };
  });

  let byCustomer = {};
  let totalPointsByCustomer = {};
  pointsPerTransaction.forEach((pointsPerTransaction) => {
    let { custid, name, month, points } = pointsPerTransaction;
    if (!byCustomer[custid]) {
      byCustomer[custid] = [];
    }
    if (!totalPointsByCustomer[custid]) {
      totalPointsByCustomer[name] = 0;
    }
    totalPointsByCustomer[name] += points;
    if (byCustomer[custid][month]) {
      byCustomer[custid][month].points += points;
      byCustomer[custid][month].monthNumber = month;
      byCustomer[custid][month].numTransactions++;
    } else {
      byCustomer[custid][month] = {
        custid,
        name,
        monthNumber: month,
        month: months[month],
        numTransactions: 1,
        points,
      };
    }
  });
  let tot = [];
  for (var custKey in byCustomer) {
    byCustomer[custKey].forEach((cRow) => {
      tot.push(cRow);
    });
  }

  let totByCustomer = [];
  for (custKey in totalPointsByCustomer) {
    totByCustomer.push({
      name: custKey,
      points: totalPointsByCustomer[custKey],
    });
  }
  return {
    summaryByCustomer: tot,
    pointsPerTransaction,
    totalPointsByCustomer: totByCustomer,
  };
}

function App() {
  const [transactionData, setTransactionData] = useState(null);

  const columns = [
    {
      Header: "Customer",
      accessor: "name",
    },
    {
      Header: "Month",
      accessor: "month",
    },
    {
      Header: "# of Transactions",
      accessor: "numTransactions",
    },
    {
      Header: "Reward Points",
      accessor: "points",
    },
  ];
  const totalsByColumns = [
    {
      Header: "Customer",
      accessor: "name",
    },
    {
      Header: "Points",
      accessor: "points",
    },
  ];

  function getIndividualTransactions(row) {
    let byCustMonth = _.filter(transactionData.pointsPerTransaction, (tRow) => {
      return (
        row.original.custid === tRow.custid &&
        row.original.monthNumber === tRow.month
      );
    });
    return byCustMonth;
  }

  useEffect(() => {
    fetch().then((data) => {
      const results = calculateResults(data);
      setTransactionData(results);
    });
  }, []);

  if (transactionData == null) {
    return <div>Loading...</div>;
  }

  return transactionData == null ? (
    <div>Loading...</div>
  ) : (
    <div className="container">
      <div className="title" width="100">
        <h2>Points Rewards System Totals by Customer Months</h2>
      </div>

      <div className="table">
        <ReactTable
          data={transactionData.summaryByCustomer}
          defaultPageSize={5}
          columns={columns}
          SubComponent={(row) => {
            return (
              <div>
                {getIndividualTransactions(row).map((tran) => {
                  return (
                    <div className="container">
                      <div className="row">
                        <div className="col-8">
                          <strong>Transaction Date:</strong>{" "}
                          {tran.transactionDt} - <strong>$</strong>
                          {tran.amt} - <strong>Points: </strong>
                          {tran.points}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }}
        />
      </div>

      <div className="container">
        <div className="row">
          <div className="title" width="100">
            <h2>Points Rewards System Totals By Customer</h2>
          </div>
        </div>
        <div className="row">
          <ReactTable
            data={transactionData.totalPointsByCustomer}
            columns={totalsByColumns}
            defaultPageSize={5}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
