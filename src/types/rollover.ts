export type RolloverMode = 'reset' | 'full' | 'surplus_only' | 'deficit_only';

export interface RolloverSettings {
    rolloverMode: RolloverMode;
}
