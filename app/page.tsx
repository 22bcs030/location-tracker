import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Package, Truck, Users, Star, CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 dark:from-blue-900/40 dark:to-purple-900/40"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-30"></div>
        </div>

        <div className="container relative z-10 mx-auto px-4 py-24 sm:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div>
                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  <span className="block">Real-time</span>
                  <span className="block text-blue-600 dark:text-blue-400">Delivery Tracking</span>
                </h1>
                <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 max-w-2xl">
                  Connect vendors, delivery partners, and customers with our powerful real-time tracking platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8 rounded-full">
                  <Link href="/auth/login">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg px-8 rounded-full">
                  <Link href="/track">Track Order</Link>
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                    >
                      {i}
                    </div>
                  ))}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">4,000+</span> deliveries completed today
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-30 dark:opacity-40"></div>
              <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
                <div className="p-4">
                  <div className="h-[400px] w-full rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden relative">
                    <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+1e88e5(-73.99,40.73),pin-s+22c55e(-73.97,40.76)/[-73.98,40.74,13]/500x400@2x?access_token=example')] bg-cover bg-center"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                      <div className="absolute w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div className="absolute top-4 left-4 right-4 glass rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">Live Tracking</span>
                        </div>
                        <div className="text-xs">Order #ORD-9385</div>
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4 glass rounded-b-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Your order is on the way</div>
                          <div className="flex items-center text-xs text-gray-500">
                            <div className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
                              <span>Arriving in 12 minutes</span>
                            </div>
                            <div className="mx-2">•</div>
                            <div>2.4 miles away</div>
                          </div>
                        </div>
                        <div className="ml-auto">
                          <Button size="sm" variant="secondary">
                            Track
                          </Button>
                        </div>
                      </div>
                      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "65%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Powerful Features for Everyone</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Our platform connects vendors, delivery partners, and customers with real-time tracking and management
            tools.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="hover-card border-t-4 border-t-blue-500">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Vendor Dashboard</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Manage orders, assign delivery partners, and track deliveries in real-time.
              </p>
              <div className="space-y-3">
                {["Order management", "Partner assignment", "Real-time tracking", "Analytics dashboard"].map(
                  (feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login?role=vendor" className="flex items-center justify-between">
                    <span>Vendor Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card border-t-4 border-t-green-500">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-4">
                <Truck className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Delivery Partner</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Accept deliveries, provide real-time location updates, and optimize your routes.
              </p>
              <div className="space-y-3">
                {["Real-time GPS tracking", "Order management", "Route optimization", "Earnings dashboard"].map(
                  (feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/auth/login?role=delivery" className="flex items-center justify-between">
                    <span>Partner Login</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-card border-t-4 border-t-purple-500">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-4">
                <MapPin className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-2">Customer Tracking</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Track your deliveries in real-time with live location updates and notifications.
              </p>
              <div className="space-y-3">
                {["Live map tracking", "Real-time updates", "Delivery notifications", "Order history"].map(
                  (feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ),
                )}
              </div>
              <div className="mt-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/track" className="flex items-center justify-between">
                    <span>Track Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-white dark:bg-gray-900 py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Our platform streamlines the delivery process from order to doorstep
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              {
                icon: <Package className="w-8 h-8 text-blue-600" />,
                title: "Order Placed",
                description: "Customer places an order with a vendor on the platform",
              },
              {
                icon: <Users className="w-8 h-8 text-green-600" />,
                title: "Partner Assignment",
                description: "Vendor assigns a delivery partner to fulfill the order",
              },
              {
                icon: <Truck className="w-8 h-8 text-orange-600" />,
                title: "Real-time Tracking",
                description: "Delivery partner shares live location during delivery",
              },
              {
                icon: <CheckCircle className="w-8 h-8 text-purple-600" />,
                title: "Order Delivered",
                description: "Customer receives order and can rate the experience",
              },
            ].map((step, i) => (
              <div key={i} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 relative">
                    {step.icon}
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{step.description}</p>
                </div>
                {i < 3 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+2rem)] right-[calc(50%-2rem)] h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">What Our Users Say</h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Hear from vendors, delivery partners, and customers who use our platform
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Johnson",
              role: "Restaurant Owner",
              quote:
                "DeliveryTracker has transformed how we manage deliveries. The real-time tracking and partner assignment features have reduced our delivery times by 30%.",
              avatar: "/placeholder.svg?height=100&width=100",
              rating: 5,
            },
            {
              name: "Michael Chen",
              role: "Delivery Partner",
              quote:
                "The app is intuitive and makes my job easier. I can see all my assigned orders, optimize my routes, and the GPS tracking works flawlessly.",
              avatar: "/placeholder.svg?height=100&width=100",
              rating: 5,
            },
            {
              name: "Emily Rodriguez",
              role: "Customer",
              quote:
                "I love being able to track my order in real-time. It's so convenient to see exactly when my food will arrive without having to call the restaurant.",
              avatar: "/placeholder.svg?height=100&width=100",
              rating: 4,
            },
          ].map((testimonial, i) => (
            <Card key={i} className="hover-card">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden">
                    <Image
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      width={48}
                      height={48}
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{testimonial.name}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 italic">"{testimonial.quote}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-800 dark:to-purple-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Delivery Experience?</h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Join thousands of businesses and delivery partners already using our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary" className="text-lg px-8 rounded-full">
              <Link href="/auth/signup">Sign Up Now</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 rounded-full bg-transparent text-white border-white hover:bg-white/10"
            >
              <Link href="/track">Track Demo Order</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Truck className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold">DeliveryTracker</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Real-time delivery management platform for multivendor marketplaces.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    API
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    About Us
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href="#"
                    className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8 text-center text-gray-600 dark:text-gray-400">
            <p>© {new Date().getFullYear()} DeliveryTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
