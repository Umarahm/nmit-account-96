"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DashboardPageLayout } from "@/components/layout";
import { useToast } from "@/components/ui/use-toast";
import {
    Calculator,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    AlertCircle,
    CheckCircle
} from "lucide-react";

interface TaxSetting {
    id: string;
    name: string;
    description: string;
    rate: number;
    type: 'inclusive' | 'exclusive';
    isDefault: boolean;
    isActive: boolean;
    category: 'goods' | 'services' | 'both';
    hsnCodes?: string[];
    createdAt: string;
    updatedAt: string;
}

interface TaxConfiguration {
    enableTax: boolean;
    defaultTaxRate: number;
    taxDisplayFormat: 'percentage' | 'decimal';
    roundingMethod: 'round' | 'floor' | 'ceil';
    compoundTax: boolean;
    taxOnShipping: boolean;
    pricesIncludeTax: boolean;
}

export default function TaxSettingsPage() {
    const [taxSettings, setTaxSettings] = useState<TaxSetting[]>([]);
    const [config, setConfig] = useState<TaxConfiguration>({
        enableTax: true,
        defaultTaxRate: 18,
        taxDisplayFormat: 'percentage',
        roundingMethod: 'round',
        compoundTax: false,
        taxOnShipping: false,
        pricesIncludeTax: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editingTax, setEditingTax] = useState<TaxSetting | null>(null);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const { toast } = useToast();

    const [newTax, setNewTax] = useState<Partial<TaxSetting>>({
        name: '',
        description: '',
        rate: 0,
        type: 'exclusive',
        isDefault: false,
        isActive: true,
        category: 'both'
    });

    useEffect(() => {
        fetchTaxSettings();
        fetchTaxConfiguration();
    }, []);

    const fetchTaxSettings = async () => {
        try {
            const response = await fetch('/api/settings/taxes');
            if (response.ok) {
                const data = await response.json();
                setTaxSettings(data);
            }
        } catch (error) {
            console.error('Error fetching tax settings:', error);
            toast({
                title: "Error",
                description: "Failed to load tax settings",
                variant: "destructive"
            });
        }
    };

    const fetchTaxConfiguration = async () => {
        try {
            const response = await fetch('/api/settings/taxes/config');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching tax configuration:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveTaxConfiguration = async () => {
        setSaving(true);
        try {
            const response = await fetch('/api/settings/taxes/config', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Tax configuration saved successfully"
                });
            } else {
                throw new Error('Failed to save configuration');
            }
        } catch (error) {
            console.error('Error saving tax configuration:', error);
            toast({
                title: "Error",
                description: "Failed to save tax configuration",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const saveTaxSetting = async (taxData: Partial<TaxSetting>) => {
        try {
            const url = taxData.id ? `/api/settings/taxes/${taxData.id}` : '/api/settings/taxes';
            const method = taxData.id ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(taxData)
            });

            if (response.ok) {
                await fetchTaxSettings();
                setEditingTax(null);
                setIsAddingNew(false);
                setNewTax({
                    name: '',
                    description: '',
                    rate: 0,
                    type: 'exclusive',
                    isDefault: false,
                    isActive: true,
                    category: 'both'
                });
                toast({
                    title: "Success",
                    description: `Tax setting ${taxData.id ? 'updated' : 'created'} successfully`
                });
            } else {
                throw new Error('Failed to save tax setting');
            }
        } catch (error) {
            console.error('Error saving tax setting:', error);
            toast({
                title: "Error",
                description: "Failed to save tax setting",
                variant: "destructive"
            });
        }
    };

    const deleteTaxSetting = async (id: string) => {
        try {
            const response = await fetch(`/api/settings/taxes/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await fetchTaxSettings();
                toast({
                    title: "Success",
                    description: "Tax setting deleted successfully"
                });
            } else {
                throw new Error('Failed to delete tax setting');
            }
        } catch (error) {
            console.error('Error deleting tax setting:', error);
            toast({
                title: "Error",
                description: "Failed to delete tax setting",
                variant: "destructive"
            });
        }
    };

    if (loading) {
        return (
            <DashboardPageLayout
                title="Tax Settings"
                description="Configure tax rates and settings for your business"
            >
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Loading tax settings...</p>
                    </div>
                </div>
            </DashboardPageLayout>
        );
    }

    return (
        <DashboardPageLayout
            title="Tax Settings"
            description="Configure tax rates and settings for your business"
            actions={
                <Button 
                    onClick={saveTaxConfiguration} 
                    disabled={saving}
                    className="gap-2"
                >
                    <Save className="h-4 w-4" />
                    {saving ? 'Saving...' : 'Save Configuration'}
                </Button>
            }
        >
            {/* Tax Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Tax Configuration
                    </CardTitle>
                    <CardDescription>
                        General tax settings and preferences
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="enable-tax">Enable Tax System</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable tax calculations
                                    </p>
                                </div>
                                <Switch
                                    id="enable-tax"
                                    checked={config.enableTax}
                                    onCheckedChange={(checked) => 
                                        setConfig(prev => ({ ...prev, enableTax: checked }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="default-tax-rate">Default Tax Rate (%)</Label>
                                <Input
                                    id="default-tax-rate"
                                    type="number"
                                    step="0.01"
                                    value={config.defaultTaxRate}
                                    onChange={(e) => 
                                        setConfig(prev => ({ ...prev, defaultTaxRate: parseFloat(e.target.value) || 0 }))
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tax-display">Tax Display Format</Label>
                                <Select
                                    value={config.taxDisplayFormat}
                                    onValueChange={(value: 'percentage' | 'decimal') =>
                                        setConfig(prev => ({ ...prev, taxDisplayFormat: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (18%)</SelectItem>
                                        <SelectItem value="decimal">Decimal (0.18)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="rounding-method">Rounding Method</Label>
                                <Select
                                    value={config.roundingMethod}
                                    onValueChange={(value: 'round' | 'floor' | 'ceil') =>
                                        setConfig(prev => ({ ...prev, roundingMethod: value }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="round">Round to nearest</SelectItem>
                                        <SelectItem value="floor">Round down</SelectItem>
                                        <SelectItem value="ceil">Round up</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="compound-tax">Compound Tax</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Apply tax on tax (GST on service tax)
                                    </p>
                                </div>
                                <Switch
                                    id="compound-tax"
                                    checked={config.compoundTax}
                                    onCheckedChange={(checked) => 
                                        setConfig(prev => ({ ...prev, compoundTax: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="tax-on-shipping">Tax on Shipping</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Apply tax to shipping charges
                                    </p>
                                </div>
                                <Switch
                                    id="tax-on-shipping"
                                    checked={config.taxOnShipping}
                                    onCheckedChange={(checked) => 
                                        setConfig(prev => ({ ...prev, taxOnShipping: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="prices-include-tax">Prices Include Tax</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Product prices include tax by default
                                    </p>
                                </div>
                                <Switch
                                    id="prices-include-tax"
                                    checked={config.pricesIncludeTax}
                                    onCheckedChange={(checked) => 
                                        setConfig(prev => ({ ...prev, pricesIncludeTax: checked }))
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tax Rules */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Tax Rules</CardTitle>
                            <CardDescription>
                                Manage specific tax rates and rules
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsAddingNew(true)}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Add Tax Rule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {isAddingNew && (
                        <Card className="mb-4 border-dashed">
                            <CardHeader>
                                <CardTitle className="text-lg">Add New Tax Rule</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-tax-name">Tax Name</Label>
                                        <Input
                                            id="new-tax-name"
                                            value={newTax.name}
                                            onChange={(e) => setNewTax(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="e.g., GST, VAT, Sales Tax"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-tax-rate">Tax Rate (%)</Label>
                                        <Input
                                            id="new-tax-rate"
                                            type="number"
                                            step="0.01"
                                            value={newTax.rate}
                                            onChange={(e) => setNewTax(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new-tax-description">Description</Label>
                                    <Input
                                        id="new-tax-description"
                                        value={newTax.description}
                                        onChange={(e) => setNewTax(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Brief description of this tax rule"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="new-tax-type">Tax Type</Label>
                                        <Select
                                            value={newTax.type}
                                            onValueChange={(value: 'inclusive' | 'exclusive') =>
                                                setNewTax(prev => ({ ...prev, type: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="exclusive">Exclusive (added to price)</SelectItem>
                                                <SelectItem value="inclusive">Inclusive (included in price)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-tax-category">Category</Label>
                                        <Select
                                            value={newTax.category}
                                            onValueChange={(value: 'goods' | 'services' | 'both') =>
                                                setNewTax(prev => ({ ...prev, category: value }))
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="both">Goods & Services</SelectItem>
                                                <SelectItem value="goods">Goods Only</SelectItem>
                                                <SelectItem value="services">Services Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-4 pt-6">
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="new-tax-default"
                                                checked={newTax.isDefault}
                                                onCheckedChange={(checked) => setNewTax(prev => ({ ...prev, isDefault: checked }))}
                                            />
                                            <Label htmlFor="new-tax-default" className="text-sm">Default</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                id="new-tax-active"
                                                checked={newTax.isActive}
                                                onCheckedChange={(checked) => setNewTax(prev => ({ ...prev, isActive: checked }))}
                                            />
                                            <Label htmlFor="new-tax-active" className="text-sm">Active</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button
                                        onClick={() => saveTaxSetting(newTax)}
                                        className="gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save Tax Rule
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddingNew(false);
                                            setNewTax({
                                                name: '',
                                                description: '',
                                                rate: 0,
                                                type: 'exclusive',
                                                isDefault: false,
                                                isActive: true,
                                                category: 'both'
                                            });
                                        }}
                                        className="gap-2"
                                    >
                                        <X className="h-4 w-4" />
                                        Cancel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="space-y-4">
                        {taxSettings.length > 0 ? (
                            taxSettings.map((tax) => (
                                <Card key={tax.id} className="border">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium">{tax.name}</h3>
                                                    <Badge variant={tax.isActive ? "default" : "secondary"}>
                                                        {tax.isActive ? "Active" : "Inactive"}
                                                    </Badge>
                                                    {tax.isDefault && (
                                                        <Badge variant="outline">Default</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{tax.description}</p>
                                                <div className="flex items-center gap-4 text-sm">
                                                    <span>Rate: <strong>{tax.rate}%</strong></span>
                                                    <span>Type: <strong>{tax.type}</strong></span>
                                                    <span>Category: <strong>{tax.category}</strong></span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingTax(tax)}
                                                    className="gap-2"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => deleteTaxSetting(tax.id)}
                                                    className="gap-2 text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-medium">No Tax Rules Configured</h3>
                                <p className="text-muted-foreground mb-4">
                                    Get started by adding your first tax rule
                                </p>
                                <Button onClick={() => setIsAddingNew(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Add Tax Rule
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </DashboardPageLayout>
    );
}