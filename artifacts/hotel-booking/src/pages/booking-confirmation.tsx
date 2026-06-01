import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGetBooking, getGetBookingQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { CheckCircle, Calendar, Users, Home, Loader2, IndianRupee } from "lucide-react";
import { format } from "date-fns";

export default function BookingConfirmation() {
  const [, params] = useRoute("/booking/:id");
  const id = params?.id ? parseInt(params.id) : 0;
  
  const { data: booking, isLoading, isError } = useGetBooking(id, {
    query: { enabled: !!id, queryKey: getGetBookingQueryKey(id) }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1>
            <p className="text-muted-foreground mb-4">We couldn't find your booking details.</p>
            <Link href="/">
              <Button>Return Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card className="overflow-hidden border-none shadow-xl">
            <div className="bg-primary p-8 text-primary-foreground text-center">
              <div className="h-16 w-16 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-serif font-bold mb-2">Booking Confirmed!</h1>
              <p className="opacity-90 text-lg">Thank you for choosing Grand Vista, {booking.guestName}.</p>
            </div>
            
            <CardContent className="p-8">
              <div className="bg-muted rounded-xl p-6 mb-8 text-center border border-border">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1 font-semibold">Confirmation Code</p>
                <p className="text-4xl font-mono tracking-widest text-foreground font-bold">{booking.confirmationCode}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Guest Details</h3>
                    <p className="font-medium text-foreground">{booking.guestName}</p>
                    <p className="text-sm text-muted-foreground">{booking.email}</p>
                    <p className="text-sm text-muted-foreground">{booking.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Stay Duration</h3>
                    <div className="flex items-center gap-2 font-medium text-foreground">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{format(new Date(booking.checkInDate), "MMM d, yyyy")} - {format(new Date(booking.checkOutDate), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Accommodation</h3>
                    <div className="flex items-center gap-2 font-medium text-foreground mb-1">
                      <Home className="h-4 w-4 text-primary" />
                      <span className="capitalize">{booking.roomType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{booking.numberOfGuests} Guest{booking.numberOfGuests > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm text-muted-foreground mb-1">Total Amount</h3>
                    <p className="text-2xl font-bold text-foreground flex items-center">
                      <IndianRupee className="h-5 w-5" />
                      {booking.totalPrice}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Paid on confirmation</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.print()}>
                  Print Details
                </Button>
                <Link href="/">
                  <Button className="w-full sm:w-auto">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
