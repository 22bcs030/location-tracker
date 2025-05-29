import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeliveryStats } from '@/types/delivery';
import { DollarSign, Clock, CheckCircle, Star, BarChart3 } from 'lucide-react';

interface PerformanceDashboardProps {
  userId: string;
  className?: string;
}

export function PerformanceDashboard({ userId, className }: PerformanceDashboardProps) {
  const [stats, setStats] = useState<DeliveryStats>({
    totalOrders: 0,
    activeOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    averageRating: 0,
    deliveryEfficiency: 0,
  });
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState(true);

  // Fetch performance stats
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would be an API call
        // For now, we'll simulate with mock data
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data based on timeframe
        let mockStats: DeliveryStats;
        
        switch (timeframe) {
          case 'today':
            mockStats = {
              totalOrders: 8,
              activeOrders: 2,
              completedOrders: 6,
              cancelledOrders: 0,
              totalEarnings: 82.50,
              todayEarnings: 82.50,
              averageRating: 4.8,
              deliveryEfficiency: 92,
            };
            break;
          case 'week':
            mockStats = {
              totalOrders: 32,
              activeOrders: 2,
              completedOrders: 29,
              cancelledOrders: 1,
              totalEarnings: 412.75,
              todayEarnings: 82.50,
              averageRating: 4.7,
              deliveryEfficiency: 88,
            };
            break;
          case 'month':
            mockStats = {
              totalOrders: 124,
              activeOrders: 2,
              completedOrders: 119,
              cancelledOrders: 3,
              totalEarnings: 1645.50,
              todayEarnings: 82.50,
              averageRating: 4.6,
              deliveryEfficiency: 90,
            };
            break;
          default:
            mockStats = {
              totalOrders: 8,
              activeOrders: 2,
              completedOrders: 6,
              cancelledOrders: 0,
              totalEarnings: 82.50,
              todayEarnings: 82.50,
              averageRating: 4.8,
              deliveryEfficiency: 92,
            };
        }
        
        setStats(mockStats);
      } catch (error) {
        console.error('Error fetching performance stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, [timeframe, userId]);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Performance Dashboard</h2>
        <Tabs 
          value={timeframe} 
          onValueChange={(value) => setTimeframe(value as 'today' | 'week' | 'month')}
          className="w-auto"
        >
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Earnings Card */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Total Earnings
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              ${stats.totalEarnings.toFixed(2)}
            </div>
            <p className="text-xs text-green-600 mt-1">
              ${stats.todayEarnings.toFixed(2)} today
            </p>
          </CardContent>
        </Card>
        
        {/* Orders Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed Orders
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {stats.completedOrders}
            </div>
            <p className="text-xs text-blue-600 mt-1">
              {stats.totalOrders} total orders
            </p>
          </CardContent>
        </Card>
        
        {/* Efficiency Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Efficiency
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">
              {stats.deliveryEfficiency}%
            </div>
            <div className="w-full bg-purple-100 rounded-full h-1.5 mt-2">
              <div 
                className="bg-purple-600 h-1.5 rounded-full" 
                style={{ width: `${stats.deliveryEfficiency}%` }}
              ></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Rating Card */}
        <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-amber-700">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Average Rating
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`w-3 h-3 ${
                    i < Math.floor(stats.averageRating) 
                      ? 'text-amber-500 fill-amber-500' 
                      : i < stats.averageRating 
                        ? 'text-amber-500 fill-amber-500 opacity-50' 
                        : 'text-amber-200'
                  }`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Additional Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Active Orders</div>
              <div className="text-xl font-semibold mt-1">{stats.activeOrders}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cancelled Orders</div>
              <div className="text-xl font-semibold mt-1">{stats.cancelledOrders}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Avg. Earning/Order</div>
              <div className="text-xl font-semibold mt-1">
                ${(stats.totalOrders > 0 ? stats.totalEarnings / stats.totalOrders : 0).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Completion Rate</div>
              <div className="text-xl font-semibold mt-1">
                {stats.totalOrders > 0 
                  ? Math.round((stats.completedOrders / stats.totalOrders) * 100) 
                  : 0}%
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Detailed analytics and reports are available in the full dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 