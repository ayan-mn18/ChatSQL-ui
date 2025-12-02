import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Users, ShoppingBag, DollarSign, Clock } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  Filler,
  ArcElement
);

export default function AnalyticsPage() {
  // Revenue Chart Data (Area Chart)
  const revenueData = {
    labels: ['5k', '10k', '15k', '20k', '25k', '30k', '35k', '40k', '45k', '50k', '55k', '60k'],
    datasets: [
      {
        label: 'Profit',
        data: [20, 30, 35, 30, 45, 55, 40, 50, 60, 55, 65, 70],
        borderColor: '#fb923c', // Orange
        backgroundColor: 'rgba(251, 146, 60, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Sales',
        data: [25, 40, 30, 35, 30, 45, 35, 40, 50, 45, 55, 60],
        borderColor: '#a78bfa', // Purple
        backgroundColor: 'rgba(167, 139, 250, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  // Sales Analytics Data (Line Chart)
  const salesAnalyticsData = {
    labels: ['2015', '2016', '2017', '2018', '2019'],
    datasets: [
      {
        label: 'Sales',
        data: [25, 60, 45, 65, 90],
        borderColor: '#3b82f6', // Blue
        backgroundColor: '#3b82f6',
        tension: 0.4,
        pointBackgroundColor: '#1e293b',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 2,
        pointRadius: 4,
      },
      {
        label: 'Returns',
        data: [15, 45, 35, 50, 75],
        borderColor: '#10b981', // Green
        backgroundColor: '#10b981',
        tension: 0.4,
        pointBackgroundColor: '#1e293b',
        pointBorderColor: '#10b981',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderDash: [5, 5],
      },
    ],
  };

  // Customers Data (Doughnut)
  const customersData = {
    labels: ['New Customers', 'Repeated'],
    datasets: [
      {
        data: [34249, 1420],
        backgroundColor: ['#3b82f6', '#e2e8f0'],
        borderWidth: 0,
        cutout: '75%',
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' },
        border: { display: false },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
  };

  const stats = [
    { title: 'Total User', value: '40,689', change: '+8.5%', trend: 'up', icon: Users, color: 'bg-purple-500' },
    { title: 'Total Order', value: '10,293', change: '+1.3%', trend: 'up', icon: ShoppingBag, color: 'bg-yellow-500' },
    { title: 'Total Sales', value: '$89,000', change: '-4.3%', trend: 'down', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Total Pending', value: '2,040', change: '+1.8%', trend: 'up', icon: Clock, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-[#273142] border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${stat.color} bg-opacity-20`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className={`flex items-center ${stat.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                  {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                  {stat.change}
                </span>
                <span className="text-gray-500">Up from yesterday</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card className="bg-[#273142] border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-lg font-medium">Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <Line options={commonOptions} data={revenueData} />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customers */}
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] relative flex items-center justify-center">
              <Doughnut options={doughnutOptions} data={customersData} />
            </div>
            <div className="mt-6 flex justify-center gap-8">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white">34,249</h4>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  New Customers
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-xl font-bold text-white">1,420</h4>
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gray-200"></span>
                  Repeated
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Product (Placeholder for now) */}
        <Card className="bg-[#273142] border-none shadow-lg flex flex-col justify-center items-center text-center p-6">
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <h3 className="text-lg font-medium text-white self-start w-full">Featured Product</h3>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-32 h-32 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <ShoppingBag className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold">Beats Headphone 2019</h4>
              <p className="text-blue-400 font-bold">$89.00</p>
            </div>
          </div>
        </Card>

        {/* Sales Analytics */}
        <Card className="bg-[#273142] border-none shadow-lg">
          <CardHeader>
            <CardTitle className="text-white text-lg font-medium">Sales Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <Line options={commonOptions} data={salesAnalyticsData} />
            </div>
            <div className="mt-4 flex justify-between text-sm text-gray-400">
              <span>2015</span>
              <span>2016</span>
              <span>2017</span>
              <span>2018</span>
              <span>2019</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
