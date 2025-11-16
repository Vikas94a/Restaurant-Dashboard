"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, Clock, MapPin } from "lucide-react";

export interface CityEvent {
    id: string;
    day: string;
    date: string;
    title: string;
    description: string;
    time: string;
    type: 'cultural' | 'sports' | 'business' | 'holiday' | 'other';
    expectedImpact: 'high' | 'medium' | 'low';
}

export interface CityEventsProps {
    onEventsChange?: (events: CityEvent[]) => void;
    initialEvents?: CityEvent[];
    location?: string;
}

export const CityEvents: React.FC<CityEventsProps> = ({ onEventsChange, initialEvents = [], location = "City" }) => {
    const [events, setEvents] = useState<CityEvent[]>(initialEvents);
    const [showForm, setShowForm] = useState(false);
    const [currentEvent, setCurrentEvent] = useState<Partial<CityEvent>>({});

    // Get next 3 days
    const getNextThreeDays = () => {
        const days = [];
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (let i = 0; i < 3; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            days.push({
                day: dayNames[date.getDay()],
                date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                fullDate: date.toISOString().split('T')[0]
            });
        }
        return days;
    };

    const nextThreeDays = getNextThreeDays();

    const eventTypes = [
        { value: 'cultural', label: 'Cultural', color: 'bg-purple-100 text-purple-800' },
        { value: 'sports', label: 'Sports', color: 'bg-green-100 text-green-800' },
        { value: 'business', label: 'Business', color: 'bg-blue-100 text-blue-800' },
        { value: 'holiday', label: 'Holiday', color: 'bg-red-100 text-red-800' },
        { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-800' }
    ];

    const impactLevels = [
        { value: 'high', label: 'High Impact', color: 'bg-red-100 text-red-800' },
        { value: 'medium', label: 'Medium Impact', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'low', label: 'Low Impact', color: 'bg-green-100 text-green-800' }
    ];

    const handleAddEvent = () => {
        if (!currentEvent.day || !currentEvent.title || !currentEvent.time) {
            alert('Please fill in all required fields');
            return;
        }

        const newEvent: CityEvent = {
            id: Date.now().toString(),
            day: currentEvent.day!,
            date: currentEvent.date!,
            title: currentEvent.title!,
            description: currentEvent.description || '',
            time: currentEvent.time!,
            type: currentEvent.type || 'other',
            expectedImpact: currentEvent.expectedImpact || 'medium'
        };

        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        setCurrentEvent({});
        setShowForm(false);
        
        if (onEventsChange) {
            onEventsChange(updatedEvents);
        }
    };

    const handleDeleteEvent = (eventId: string) => {
        const updatedEvents = events.filter(event => event.id !== eventId);
        setEvents(updatedEvents);
        
        if (onEventsChange) {
            onEventsChange(updatedEvents);
        }
    };

    const getEventTypeColor = (type: string) => {
        return eventTypes.find(t => t.value === type)?.color || 'bg-gray-100 text-gray-800';
    };

    const getImpactColor = (impact: string) => {
        return impactLevels.find(i => i.value === impact)?.color || 'bg-gray-100 text-gray-800';
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        City Events - {location}
                    </CardTitle>
                    <Button
                        onClick={() => setShowForm(!showForm)}
                        size="sm"
                        className="flex items-center gap-1"
                    >
                        <Plus className="h-4 w-4" />
                        Add City Event
                    </Button>
                </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Add Event Form */}
                {showForm && (
                    <div className="p-4 border rounded-lg bg-gray-50 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="day">Day *</Label>
                                <select
                                    id="day"
                                    value={currentEvent.day || ''}
                                    onChange={(e) => setCurrentEvent({
                                        ...currentEvent,
                                        day: e.target.value,
                                        date: nextThreeDays.find(d => d.day === e.target.value)?.date || ''
                                    })}
                                    className="w-full p-2 border rounded-md mt-1"
                                >
                                    <option value="">Select a day</option>
                                    {nextThreeDays.map((day) => (
                                        <option key={day.day} value={day.day}>
                                            {day.day} ({day.date})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="time">Time *</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={currentEvent.time || ''}
                                    onChange={(e) => setCurrentEvent({
                                        ...currentEvent,
                                        time: e.target.value
                                    })}
                                    className="mt-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="title">Event Title *</Label>
                            <Input
                                id="title"
                                value={currentEvent.title || ''}
                                onChange={(e) => setCurrentEvent({
                                    ...currentEvent,
                                    title: e.target.value
                                })}
                                placeholder="e.g., City Music Festival, Sports Tournament"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={currentEvent.description || ''}
                                onChange={(e) => setCurrentEvent({
                                    ...currentEvent,
                                    description: e.target.value
                                })}
                                placeholder="Brief description of the city event"
                                className="mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type">Event Type</Label>
                                <select
                                    id="type"
                                    value={currentEvent.type || 'other'}
                                    onChange={(e) => setCurrentEvent({
                                        ...currentEvent,
                                        type: e.target.value as CityEvent['type']
                                    })}
                                    className="w-full p-2 border rounded-md mt-1"
                                >
                                    {eventTypes.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="impact">Expected Impact</Label>
                                <select
                                    id="impact"
                                    value={currentEvent.expectedImpact || 'medium'}
                                    onChange={(e) => setCurrentEvent({
                                        ...currentEvent,
                                        expectedImpact: e.target.value as CityEvent['expectedImpact']
                                    })}
                                    className="w-full p-2 border rounded-md mt-1"
                                >
                                    {impactLevels.map((impact) => (
                                        <option key={impact.value} value={impact.value}>
                                            {impact.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={handleAddEvent} className="flex-1">
                                Add City Event
                            </Button>
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setShowForm(false);
                                    setCurrentEvent({});
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                )}

                {/* Events List */}
                <div className="space-y-3">
                    {events.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                            <p>No city events scheduled for the next 3 days</p>
                            <p className="text-sm">Add city events that might affect your business</p>
                        </div>
                    ) : (
                        events.map((event) => (
                            <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-medium">{event.title}</h4>
                                        <Badge className={getEventTypeColor(event.type)}>
                                            {eventTypes.find(t => t.value === event.type)?.label}
                                        </Badge>
                                        <Badge className={getImpactColor(event.expectedImpact)}>
                                            {impactLevels.find(i => i.value === event.expectedImpact)?.label}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {event.day} ({event.date})
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {event.time}
                                        </span>
                                    </div>
                                    {event.description && (
                                        <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteEvent(event.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default CityEvents; 