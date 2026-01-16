export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      balance_sheets: {
        Row: {
          accepted_date: string | null
          account_payables_eur: number | null
          account_payables_orig: number | null
          account_payables_usd: number | null
          accounts_receivables_eur: number | null
          accounts_receivables_orig: number | null
          accounts_receivables_usd: number | null
          accrued_expenses_eur: number | null
          accrued_expenses_orig: number | null
          accrued_expenses_usd: number | null
          accumulated_other_comprehensive_income_loss_eur: number | null
          accumulated_other_comprehensive_income_loss_orig: number | null
          accumulated_other_comprehensive_income_loss_usd: number | null
          additional_paid_in_capital_eur: number | null
          additional_paid_in_capital_orig: number | null
          additional_paid_in_capital_usd: number | null
          capital_lease_obligations_current_eur: number | null
          capital_lease_obligations_current_orig: number | null
          capital_lease_obligations_current_usd: number | null
          capital_lease_obligations_eur: number | null
          capital_lease_obligations_non_current_eur: number | null
          capital_lease_obligations_non_current_orig: number | null
          capital_lease_obligations_non_current_usd: number | null
          capital_lease_obligations_orig: number | null
          capital_lease_obligations_usd: number | null
          cash_and_cash_equivalents_eur: number | null
          cash_and_cash_equivalents_orig: number | null
          cash_and_cash_equivalents_usd: number | null
          cash_and_short_term_investments_eur: number | null
          cash_and_short_term_investments_orig: number | null
          cash_and_short_term_investments_usd: number | null
          cik: string | null
          common_stock_eur: number | null
          common_stock_orig: number | null
          common_stock_usd: number | null
          created_at: string | null
          date: string
          deferred_revenue_eur: number | null
          deferred_revenue_non_current_eur: number | null
          deferred_revenue_non_current_orig: number | null
          deferred_revenue_non_current_usd: number | null
          deferred_revenue_orig: number | null
          deferred_revenue_usd: number | null
          deferred_tax_liabilities_non_current_eur: number | null
          deferred_tax_liabilities_non_current_orig: number | null
          deferred_tax_liabilities_non_current_usd: number | null
          filing_date: string | null
          fiscal_year: string | null
          goodwill_and_intangible_assets_eur: number | null
          goodwill_and_intangible_assets_orig: number | null
          goodwill_and_intangible_assets_usd: number | null
          goodwill_eur: number | null
          goodwill_orig: number | null
          goodwill_usd: number | null
          id: string
          intangible_assets_eur: number | null
          intangible_assets_orig: number | null
          intangible_assets_usd: number | null
          inventory_eur: number | null
          inventory_orig: number | null
          inventory_usd: number | null
          long_term_debt_eur: number | null
          long_term_debt_orig: number | null
          long_term_debt_usd: number | null
          long_term_investments_eur: number | null
          long_term_investments_orig: number | null
          long_term_investments_usd: number | null
          minority_interest_eur: number | null
          minority_interest_orig: number | null
          minority_interest_usd: number | null
          net_debt_eur: number | null
          net_debt_orig: number | null
          net_debt_usd: number | null
          net_receivables_eur: number | null
          net_receivables_orig: number | null
          net_receivables_usd: number | null
          other_assets_eur: number | null
          other_assets_orig: number | null
          other_assets_usd: number | null
          other_current_assets_eur: number | null
          other_current_assets_orig: number | null
          other_current_assets_usd: number | null
          other_current_liabilities_eur: number | null
          other_current_liabilities_orig: number | null
          other_current_liabilities_usd: number | null
          other_liabilities_eur: number | null
          other_liabilities_orig: number | null
          other_liabilities_usd: number | null
          other_non_current_assets_eur: number | null
          other_non_current_assets_orig: number | null
          other_non_current_assets_usd: number | null
          other_non_current_liabilities_eur: number | null
          other_non_current_liabilities_orig: number | null
          other_non_current_liabilities_usd: number | null
          other_payables_eur: number | null
          other_payables_orig: number | null
          other_payables_usd: number | null
          other_receivables_eur: number | null
          other_receivables_orig: number | null
          other_receivables_usd: number | null
          other_total_stockholders_equity_eur: number | null
          other_total_stockholders_equity_orig: number | null
          other_total_stockholders_equity_usd: number | null
          period: string
          preferred_stock_eur: number | null
          preferred_stock_orig: number | null
          preferred_stock_usd: number | null
          prepaids_eur: number | null
          prepaids_orig: number | null
          prepaids_usd: number | null
          property_plant_equipment_net_eur: number | null
          property_plant_equipment_net_orig: number | null
          property_plant_equipment_net_usd: number | null
          reported_currency: string
          retained_earnings_eur: number | null
          retained_earnings_orig: number | null
          retained_earnings_usd: number | null
          short_term_debt_eur: number | null
          short_term_debt_orig: number | null
          short_term_debt_usd: number | null
          short_term_investments_eur: number | null
          short_term_investments_orig: number | null
          short_term_investments_usd: number | null
          symbol: string
          tax_assets_eur: number | null
          tax_assets_orig: number | null
          tax_assets_usd: number | null
          tax_payables_eur: number | null
          tax_payables_orig: number | null
          tax_payables_usd: number | null
          total_assets_eur: number | null
          total_assets_orig: number | null
          total_assets_usd: number | null
          total_current_assets_eur: number | null
          total_current_assets_orig: number | null
          total_current_assets_usd: number | null
          total_current_liabilities_eur: number | null
          total_current_liabilities_orig: number | null
          total_current_liabilities_usd: number | null
          total_debt_eur: number | null
          total_debt_orig: number | null
          total_debt_usd: number | null
          total_equity_eur: number | null
          total_equity_orig: number | null
          total_equity_usd: number | null
          total_investments_eur: number | null
          total_investments_orig: number | null
          total_investments_usd: number | null
          total_liabilities_and_total_equity_eur: number | null
          total_liabilities_and_total_equity_orig: number | null
          total_liabilities_and_total_equity_usd: number | null
          total_liabilities_eur: number | null
          total_liabilities_orig: number | null
          total_liabilities_usd: number | null
          total_non_current_assets_eur: number | null
          total_non_current_assets_orig: number | null
          total_non_current_assets_usd: number | null
          total_non_current_liabilities_eur: number | null
          total_non_current_liabilities_orig: number | null
          total_non_current_liabilities_usd: number | null
          total_payables_eur: number | null
          total_payables_orig: number | null
          total_payables_usd: number | null
          total_stockholders_equity_eur: number | null
          total_stockholders_equity_orig: number | null
          total_stockholders_equity_usd: number | null
          treasury_stock_eur: number | null
          treasury_stock_orig: number | null
          treasury_stock_usd: number | null
          updated_at: string | null
        }
        Insert: {
          accepted_date?: string | null
          account_payables_eur?: number | null
          account_payables_orig?: number | null
          account_payables_usd?: number | null
          accounts_receivables_eur?: number | null
          accounts_receivables_orig?: number | null
          accounts_receivables_usd?: number | null
          accrued_expenses_eur?: number | null
          accrued_expenses_orig?: number | null
          accrued_expenses_usd?: number | null
          accumulated_other_comprehensive_income_loss_eur?: number | null
          accumulated_other_comprehensive_income_loss_orig?: number | null
          accumulated_other_comprehensive_income_loss_usd?: number | null
          additional_paid_in_capital_eur?: number | null
          additional_paid_in_capital_orig?: number | null
          additional_paid_in_capital_usd?: number | null
          capital_lease_obligations_current_eur?: number | null
          capital_lease_obligations_current_orig?: number | null
          capital_lease_obligations_current_usd?: number | null
          capital_lease_obligations_eur?: number | null
          capital_lease_obligations_non_current_eur?: number | null
          capital_lease_obligations_non_current_orig?: number | null
          capital_lease_obligations_non_current_usd?: number | null
          capital_lease_obligations_orig?: number | null
          capital_lease_obligations_usd?: number | null
          cash_and_cash_equivalents_eur?: number | null
          cash_and_cash_equivalents_orig?: number | null
          cash_and_cash_equivalents_usd?: number | null
          cash_and_short_term_investments_eur?: number | null
          cash_and_short_term_investments_orig?: number | null
          cash_and_short_term_investments_usd?: number | null
          cik?: string | null
          common_stock_eur?: number | null
          common_stock_orig?: number | null
          common_stock_usd?: number | null
          created_at?: string | null
          date: string
          deferred_revenue_eur?: number | null
          deferred_revenue_non_current_eur?: number | null
          deferred_revenue_non_current_orig?: number | null
          deferred_revenue_non_current_usd?: number | null
          deferred_revenue_orig?: number | null
          deferred_revenue_usd?: number | null
          deferred_tax_liabilities_non_current_eur?: number | null
          deferred_tax_liabilities_non_current_orig?: number | null
          deferred_tax_liabilities_non_current_usd?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          goodwill_and_intangible_assets_eur?: number | null
          goodwill_and_intangible_assets_orig?: number | null
          goodwill_and_intangible_assets_usd?: number | null
          goodwill_eur?: number | null
          goodwill_orig?: number | null
          goodwill_usd?: number | null
          id?: string
          intangible_assets_eur?: number | null
          intangible_assets_orig?: number | null
          intangible_assets_usd?: number | null
          inventory_eur?: number | null
          inventory_orig?: number | null
          inventory_usd?: number | null
          long_term_debt_eur?: number | null
          long_term_debt_orig?: number | null
          long_term_debt_usd?: number | null
          long_term_investments_eur?: number | null
          long_term_investments_orig?: number | null
          long_term_investments_usd?: number | null
          minority_interest_eur?: number | null
          minority_interest_orig?: number | null
          minority_interest_usd?: number | null
          net_debt_eur?: number | null
          net_debt_orig?: number | null
          net_debt_usd?: number | null
          net_receivables_eur?: number | null
          net_receivables_orig?: number | null
          net_receivables_usd?: number | null
          other_assets_eur?: number | null
          other_assets_orig?: number | null
          other_assets_usd?: number | null
          other_current_assets_eur?: number | null
          other_current_assets_orig?: number | null
          other_current_assets_usd?: number | null
          other_current_liabilities_eur?: number | null
          other_current_liabilities_orig?: number | null
          other_current_liabilities_usd?: number | null
          other_liabilities_eur?: number | null
          other_liabilities_orig?: number | null
          other_liabilities_usd?: number | null
          other_non_current_assets_eur?: number | null
          other_non_current_assets_orig?: number | null
          other_non_current_assets_usd?: number | null
          other_non_current_liabilities_eur?: number | null
          other_non_current_liabilities_orig?: number | null
          other_non_current_liabilities_usd?: number | null
          other_payables_eur?: number | null
          other_payables_orig?: number | null
          other_payables_usd?: number | null
          other_receivables_eur?: number | null
          other_receivables_orig?: number | null
          other_receivables_usd?: number | null
          other_total_stockholders_equity_eur?: number | null
          other_total_stockholders_equity_orig?: number | null
          other_total_stockholders_equity_usd?: number | null
          period: string
          preferred_stock_eur?: number | null
          preferred_stock_orig?: number | null
          preferred_stock_usd?: number | null
          prepaids_eur?: number | null
          prepaids_orig?: number | null
          prepaids_usd?: number | null
          property_plant_equipment_net_eur?: number | null
          property_plant_equipment_net_orig?: number | null
          property_plant_equipment_net_usd?: number | null
          reported_currency: string
          retained_earnings_eur?: number | null
          retained_earnings_orig?: number | null
          retained_earnings_usd?: number | null
          short_term_debt_eur?: number | null
          short_term_debt_orig?: number | null
          short_term_debt_usd?: number | null
          short_term_investments_eur?: number | null
          short_term_investments_orig?: number | null
          short_term_investments_usd?: number | null
          symbol: string
          tax_assets_eur?: number | null
          tax_assets_orig?: number | null
          tax_assets_usd?: number | null
          tax_payables_eur?: number | null
          tax_payables_orig?: number | null
          tax_payables_usd?: number | null
          total_assets_eur?: number | null
          total_assets_orig?: number | null
          total_assets_usd?: number | null
          total_current_assets_eur?: number | null
          total_current_assets_orig?: number | null
          total_current_assets_usd?: number | null
          total_current_liabilities_eur?: number | null
          total_current_liabilities_orig?: number | null
          total_current_liabilities_usd?: number | null
          total_debt_eur?: number | null
          total_debt_orig?: number | null
          total_debt_usd?: number | null
          total_equity_eur?: number | null
          total_equity_orig?: number | null
          total_equity_usd?: number | null
          total_investments_eur?: number | null
          total_investments_orig?: number | null
          total_investments_usd?: number | null
          total_liabilities_and_total_equity_eur?: number | null
          total_liabilities_and_total_equity_orig?: number | null
          total_liabilities_and_total_equity_usd?: number | null
          total_liabilities_eur?: number | null
          total_liabilities_orig?: number | null
          total_liabilities_usd?: number | null
          total_non_current_assets_eur?: number | null
          total_non_current_assets_orig?: number | null
          total_non_current_assets_usd?: number | null
          total_non_current_liabilities_eur?: number | null
          total_non_current_liabilities_orig?: number | null
          total_non_current_liabilities_usd?: number | null
          total_payables_eur?: number | null
          total_payables_orig?: number | null
          total_payables_usd?: number | null
          total_stockholders_equity_eur?: number | null
          total_stockholders_equity_orig?: number | null
          total_stockholders_equity_usd?: number | null
          treasury_stock_eur?: number | null
          treasury_stock_orig?: number | null
          treasury_stock_usd?: number | null
          updated_at?: string | null
        }
        Update: {
          accepted_date?: string | null
          account_payables_eur?: number | null
          account_payables_orig?: number | null
          account_payables_usd?: number | null
          accounts_receivables_eur?: number | null
          accounts_receivables_orig?: number | null
          accounts_receivables_usd?: number | null
          accrued_expenses_eur?: number | null
          accrued_expenses_orig?: number | null
          accrued_expenses_usd?: number | null
          accumulated_other_comprehensive_income_loss_eur?: number | null
          accumulated_other_comprehensive_income_loss_orig?: number | null
          accumulated_other_comprehensive_income_loss_usd?: number | null
          additional_paid_in_capital_eur?: number | null
          additional_paid_in_capital_orig?: number | null
          additional_paid_in_capital_usd?: number | null
          capital_lease_obligations_current_eur?: number | null
          capital_lease_obligations_current_orig?: number | null
          capital_lease_obligations_current_usd?: number | null
          capital_lease_obligations_eur?: number | null
          capital_lease_obligations_non_current_eur?: number | null
          capital_lease_obligations_non_current_orig?: number | null
          capital_lease_obligations_non_current_usd?: number | null
          capital_lease_obligations_orig?: number | null
          capital_lease_obligations_usd?: number | null
          cash_and_cash_equivalents_eur?: number | null
          cash_and_cash_equivalents_orig?: number | null
          cash_and_cash_equivalents_usd?: number | null
          cash_and_short_term_investments_eur?: number | null
          cash_and_short_term_investments_orig?: number | null
          cash_and_short_term_investments_usd?: number | null
          cik?: string | null
          common_stock_eur?: number | null
          common_stock_orig?: number | null
          common_stock_usd?: number | null
          created_at?: string | null
          date?: string
          deferred_revenue_eur?: number | null
          deferred_revenue_non_current_eur?: number | null
          deferred_revenue_non_current_orig?: number | null
          deferred_revenue_non_current_usd?: number | null
          deferred_revenue_orig?: number | null
          deferred_revenue_usd?: number | null
          deferred_tax_liabilities_non_current_eur?: number | null
          deferred_tax_liabilities_non_current_orig?: number | null
          deferred_tax_liabilities_non_current_usd?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          goodwill_and_intangible_assets_eur?: number | null
          goodwill_and_intangible_assets_orig?: number | null
          goodwill_and_intangible_assets_usd?: number | null
          goodwill_eur?: number | null
          goodwill_orig?: number | null
          goodwill_usd?: number | null
          id?: string
          intangible_assets_eur?: number | null
          intangible_assets_orig?: number | null
          intangible_assets_usd?: number | null
          inventory_eur?: number | null
          inventory_orig?: number | null
          inventory_usd?: number | null
          long_term_debt_eur?: number | null
          long_term_debt_orig?: number | null
          long_term_debt_usd?: number | null
          long_term_investments_eur?: number | null
          long_term_investments_orig?: number | null
          long_term_investments_usd?: number | null
          minority_interest_eur?: number | null
          minority_interest_orig?: number | null
          minority_interest_usd?: number | null
          net_debt_eur?: number | null
          net_debt_orig?: number | null
          net_debt_usd?: number | null
          net_receivables_eur?: number | null
          net_receivables_orig?: number | null
          net_receivables_usd?: number | null
          other_assets_eur?: number | null
          other_assets_orig?: number | null
          other_assets_usd?: number | null
          other_current_assets_eur?: number | null
          other_current_assets_orig?: number | null
          other_current_assets_usd?: number | null
          other_current_liabilities_eur?: number | null
          other_current_liabilities_orig?: number | null
          other_current_liabilities_usd?: number | null
          other_liabilities_eur?: number | null
          other_liabilities_orig?: number | null
          other_liabilities_usd?: number | null
          other_non_current_assets_eur?: number | null
          other_non_current_assets_orig?: number | null
          other_non_current_assets_usd?: number | null
          other_non_current_liabilities_eur?: number | null
          other_non_current_liabilities_orig?: number | null
          other_non_current_liabilities_usd?: number | null
          other_payables_eur?: number | null
          other_payables_orig?: number | null
          other_payables_usd?: number | null
          other_receivables_eur?: number | null
          other_receivables_orig?: number | null
          other_receivables_usd?: number | null
          other_total_stockholders_equity_eur?: number | null
          other_total_stockholders_equity_orig?: number | null
          other_total_stockholders_equity_usd?: number | null
          period?: string
          preferred_stock_eur?: number | null
          preferred_stock_orig?: number | null
          preferred_stock_usd?: number | null
          prepaids_eur?: number | null
          prepaids_orig?: number | null
          prepaids_usd?: number | null
          property_plant_equipment_net_eur?: number | null
          property_plant_equipment_net_orig?: number | null
          property_plant_equipment_net_usd?: number | null
          reported_currency?: string
          retained_earnings_eur?: number | null
          retained_earnings_orig?: number | null
          retained_earnings_usd?: number | null
          short_term_debt_eur?: number | null
          short_term_debt_orig?: number | null
          short_term_debt_usd?: number | null
          short_term_investments_eur?: number | null
          short_term_investments_orig?: number | null
          short_term_investments_usd?: number | null
          symbol?: string
          tax_assets_eur?: number | null
          tax_assets_orig?: number | null
          tax_assets_usd?: number | null
          tax_payables_eur?: number | null
          tax_payables_orig?: number | null
          tax_payables_usd?: number | null
          total_assets_eur?: number | null
          total_assets_orig?: number | null
          total_assets_usd?: number | null
          total_current_assets_eur?: number | null
          total_current_assets_orig?: number | null
          total_current_assets_usd?: number | null
          total_current_liabilities_eur?: number | null
          total_current_liabilities_orig?: number | null
          total_current_liabilities_usd?: number | null
          total_debt_eur?: number | null
          total_debt_orig?: number | null
          total_debt_usd?: number | null
          total_equity_eur?: number | null
          total_equity_orig?: number | null
          total_equity_usd?: number | null
          total_investments_eur?: number | null
          total_investments_orig?: number | null
          total_investments_usd?: number | null
          total_liabilities_and_total_equity_eur?: number | null
          total_liabilities_and_total_equity_orig?: number | null
          total_liabilities_and_total_equity_usd?: number | null
          total_liabilities_eur?: number | null
          total_liabilities_orig?: number | null
          total_liabilities_usd?: number | null
          total_non_current_assets_eur?: number | null
          total_non_current_assets_orig?: number | null
          total_non_current_assets_usd?: number | null
          total_non_current_liabilities_eur?: number | null
          total_non_current_liabilities_orig?: number | null
          total_non_current_liabilities_usd?: number | null
          total_payables_eur?: number | null
          total_payables_orig?: number | null
          total_payables_usd?: number | null
          total_stockholders_equity_eur?: number | null
          total_stockholders_equity_orig?: number | null
          total_stockholders_equity_usd?: number | null
          treasury_stock_eur?: number | null
          treasury_stock_orig?: number | null
          treasury_stock_usd?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cash_flow_statements: {
        Row: {
          accepted_date: string | null
          accounts_payables_eur: number | null
          accounts_payables_orig: number | null
          accounts_payables_usd: number | null
          accounts_receivables_eur: number | null
          accounts_receivables_orig: number | null
          accounts_receivables_usd: number | null
          acquisitions_net_eur: number | null
          acquisitions_net_orig: number | null
          acquisitions_net_usd: number | null
          capital_expenditure_eur: number | null
          capital_expenditure_orig: number | null
          capital_expenditure_usd: number | null
          cash_at_beginning_of_period_eur: number | null
          cash_at_beginning_of_period_orig: number | null
          cash_at_beginning_of_period_usd: number | null
          cash_at_end_of_period_eur: number | null
          cash_at_end_of_period_orig: number | null
          cash_at_end_of_period_usd: number | null
          change_in_working_capital_eur: number | null
          change_in_working_capital_orig: number | null
          change_in_working_capital_usd: number | null
          cik: string | null
          common_dividends_paid_eur: number | null
          common_dividends_paid_orig: number | null
          common_dividends_paid_usd: number | null
          common_stock_issuance_eur: number | null
          common_stock_issuance_orig: number | null
          common_stock_issuance_usd: number | null
          common_stock_repurchased_eur: number | null
          common_stock_repurchased_orig: number | null
          common_stock_repurchased_usd: number | null
          created_at: string | null
          date: string
          deferred_income_tax_eur: number | null
          deferred_income_tax_orig: number | null
          deferred_income_tax_usd: number | null
          depreciation_and_amortization_eur: number | null
          depreciation_and_amortization_orig: number | null
          depreciation_and_amortization_usd: number | null
          effect_of_forex_changes_on_cash_eur: number | null
          effect_of_forex_changes_on_cash_orig: number | null
          effect_of_forex_changes_on_cash_usd: number | null
          filing_date: string | null
          fiscal_year: string | null
          free_cash_flow_eur: number | null
          free_cash_flow_orig: number | null
          free_cash_flow_usd: number | null
          id: string
          income_taxes_paid_eur: number | null
          income_taxes_paid_orig: number | null
          income_taxes_paid_usd: number | null
          interest_paid_eur: number | null
          interest_paid_orig: number | null
          interest_paid_usd: number | null
          inventory_eur: number | null
          inventory_orig: number | null
          inventory_usd: number | null
          investments_in_property_plant_and_equipment_eur: number | null
          investments_in_property_plant_and_equipment_orig: number | null
          investments_in_property_plant_and_equipment_usd: number | null
          long_term_net_debt_issuance_eur: number | null
          long_term_net_debt_issuance_orig: number | null
          long_term_net_debt_issuance_usd: number | null
          net_cash_provided_by_financing_activities_eur: number | null
          net_cash_provided_by_financing_activities_orig: number | null
          net_cash_provided_by_financing_activities_usd: number | null
          net_cash_provided_by_investing_activities_eur: number | null
          net_cash_provided_by_investing_activities_orig: number | null
          net_cash_provided_by_investing_activities_usd: number | null
          net_cash_provided_by_operating_activities_eur: number | null
          net_cash_provided_by_operating_activities_orig: number | null
          net_cash_provided_by_operating_activities_usd: number | null
          net_change_in_cash_eur: number | null
          net_change_in_cash_orig: number | null
          net_change_in_cash_usd: number | null
          net_common_stock_issuance_eur: number | null
          net_common_stock_issuance_orig: number | null
          net_common_stock_issuance_usd: number | null
          net_debt_issuance_eur: number | null
          net_debt_issuance_orig: number | null
          net_debt_issuance_usd: number | null
          net_dividends_paid_eur: number | null
          net_dividends_paid_orig: number | null
          net_dividends_paid_usd: number | null
          net_income_eur: number | null
          net_income_orig: number | null
          net_income_usd: number | null
          net_preferred_stock_issuance_eur: number | null
          net_preferred_stock_issuance_orig: number | null
          net_preferred_stock_issuance_usd: number | null
          net_stock_issuance_eur: number | null
          net_stock_issuance_orig: number | null
          net_stock_issuance_usd: number | null
          operating_cash_flow_eur: number | null
          operating_cash_flow_orig: number | null
          operating_cash_flow_usd: number | null
          other_financing_activities_eur: number | null
          other_financing_activities_orig: number | null
          other_financing_activities_usd: number | null
          other_investing_activities_eur: number | null
          other_investing_activities_orig: number | null
          other_investing_activities_usd: number | null
          other_non_cash_items_eur: number | null
          other_non_cash_items_orig: number | null
          other_non_cash_items_usd: number | null
          other_working_capital_eur: number | null
          other_working_capital_orig: number | null
          other_working_capital_usd: number | null
          period: string
          preferred_dividends_paid_eur: number | null
          preferred_dividends_paid_orig: number | null
          preferred_dividends_paid_usd: number | null
          purchases_of_investments_eur: number | null
          purchases_of_investments_orig: number | null
          purchases_of_investments_usd: number | null
          reported_currency: string
          sales_maturities_of_investments_eur: number | null
          sales_maturities_of_investments_orig: number | null
          sales_maturities_of_investments_usd: number | null
          short_term_net_debt_issuance_eur: number | null
          short_term_net_debt_issuance_orig: number | null
          short_term_net_debt_issuance_usd: number | null
          stock_based_compensation_eur: number | null
          stock_based_compensation_orig: number | null
          stock_based_compensation_usd: number | null
          symbol: string
          updated_at: string | null
        }
        Insert: {
          accepted_date?: string | null
          accounts_payables_eur?: number | null
          accounts_payables_orig?: number | null
          accounts_payables_usd?: number | null
          accounts_receivables_eur?: number | null
          accounts_receivables_orig?: number | null
          accounts_receivables_usd?: number | null
          acquisitions_net_eur?: number | null
          acquisitions_net_orig?: number | null
          acquisitions_net_usd?: number | null
          capital_expenditure_eur?: number | null
          capital_expenditure_orig?: number | null
          capital_expenditure_usd?: number | null
          cash_at_beginning_of_period_eur?: number | null
          cash_at_beginning_of_period_orig?: number | null
          cash_at_beginning_of_period_usd?: number | null
          cash_at_end_of_period_eur?: number | null
          cash_at_end_of_period_orig?: number | null
          cash_at_end_of_period_usd?: number | null
          change_in_working_capital_eur?: number | null
          change_in_working_capital_orig?: number | null
          change_in_working_capital_usd?: number | null
          cik?: string | null
          common_dividends_paid_eur?: number | null
          common_dividends_paid_orig?: number | null
          common_dividends_paid_usd?: number | null
          common_stock_issuance_eur?: number | null
          common_stock_issuance_orig?: number | null
          common_stock_issuance_usd?: number | null
          common_stock_repurchased_eur?: number | null
          common_stock_repurchased_orig?: number | null
          common_stock_repurchased_usd?: number | null
          created_at?: string | null
          date: string
          deferred_income_tax_eur?: number | null
          deferred_income_tax_orig?: number | null
          deferred_income_tax_usd?: number | null
          depreciation_and_amortization_eur?: number | null
          depreciation_and_amortization_orig?: number | null
          depreciation_and_amortization_usd?: number | null
          effect_of_forex_changes_on_cash_eur?: number | null
          effect_of_forex_changes_on_cash_orig?: number | null
          effect_of_forex_changes_on_cash_usd?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          free_cash_flow_eur?: number | null
          free_cash_flow_orig?: number | null
          free_cash_flow_usd?: number | null
          id?: string
          income_taxes_paid_eur?: number | null
          income_taxes_paid_orig?: number | null
          income_taxes_paid_usd?: number | null
          interest_paid_eur?: number | null
          interest_paid_orig?: number | null
          interest_paid_usd?: number | null
          inventory_eur?: number | null
          inventory_orig?: number | null
          inventory_usd?: number | null
          investments_in_property_plant_and_equipment_eur?: number | null
          investments_in_property_plant_and_equipment_orig?: number | null
          investments_in_property_plant_and_equipment_usd?: number | null
          long_term_net_debt_issuance_eur?: number | null
          long_term_net_debt_issuance_orig?: number | null
          long_term_net_debt_issuance_usd?: number | null
          net_cash_provided_by_financing_activities_eur?: number | null
          net_cash_provided_by_financing_activities_orig?: number | null
          net_cash_provided_by_financing_activities_usd?: number | null
          net_cash_provided_by_investing_activities_eur?: number | null
          net_cash_provided_by_investing_activities_orig?: number | null
          net_cash_provided_by_investing_activities_usd?: number | null
          net_cash_provided_by_operating_activities_eur?: number | null
          net_cash_provided_by_operating_activities_orig?: number | null
          net_cash_provided_by_operating_activities_usd?: number | null
          net_change_in_cash_eur?: number | null
          net_change_in_cash_orig?: number | null
          net_change_in_cash_usd?: number | null
          net_common_stock_issuance_eur?: number | null
          net_common_stock_issuance_orig?: number | null
          net_common_stock_issuance_usd?: number | null
          net_debt_issuance_eur?: number | null
          net_debt_issuance_orig?: number | null
          net_debt_issuance_usd?: number | null
          net_dividends_paid_eur?: number | null
          net_dividends_paid_orig?: number | null
          net_dividends_paid_usd?: number | null
          net_income_eur?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          net_preferred_stock_issuance_eur?: number | null
          net_preferred_stock_issuance_orig?: number | null
          net_preferred_stock_issuance_usd?: number | null
          net_stock_issuance_eur?: number | null
          net_stock_issuance_orig?: number | null
          net_stock_issuance_usd?: number | null
          operating_cash_flow_eur?: number | null
          operating_cash_flow_orig?: number | null
          operating_cash_flow_usd?: number | null
          other_financing_activities_eur?: number | null
          other_financing_activities_orig?: number | null
          other_financing_activities_usd?: number | null
          other_investing_activities_eur?: number | null
          other_investing_activities_orig?: number | null
          other_investing_activities_usd?: number | null
          other_non_cash_items_eur?: number | null
          other_non_cash_items_orig?: number | null
          other_non_cash_items_usd?: number | null
          other_working_capital_eur?: number | null
          other_working_capital_orig?: number | null
          other_working_capital_usd?: number | null
          period: string
          preferred_dividends_paid_eur?: number | null
          preferred_dividends_paid_orig?: number | null
          preferred_dividends_paid_usd?: number | null
          purchases_of_investments_eur?: number | null
          purchases_of_investments_orig?: number | null
          purchases_of_investments_usd?: number | null
          reported_currency: string
          sales_maturities_of_investments_eur?: number | null
          sales_maturities_of_investments_orig?: number | null
          sales_maturities_of_investments_usd?: number | null
          short_term_net_debt_issuance_eur?: number | null
          short_term_net_debt_issuance_orig?: number | null
          short_term_net_debt_issuance_usd?: number | null
          stock_based_compensation_eur?: number | null
          stock_based_compensation_orig?: number | null
          stock_based_compensation_usd?: number | null
          symbol: string
          updated_at?: string | null
        }
        Update: {
          accepted_date?: string | null
          accounts_payables_eur?: number | null
          accounts_payables_orig?: number | null
          accounts_payables_usd?: number | null
          accounts_receivables_eur?: number | null
          accounts_receivables_orig?: number | null
          accounts_receivables_usd?: number | null
          acquisitions_net_eur?: number | null
          acquisitions_net_orig?: number | null
          acquisitions_net_usd?: number | null
          capital_expenditure_eur?: number | null
          capital_expenditure_orig?: number | null
          capital_expenditure_usd?: number | null
          cash_at_beginning_of_period_eur?: number | null
          cash_at_beginning_of_period_orig?: number | null
          cash_at_beginning_of_period_usd?: number | null
          cash_at_end_of_period_eur?: number | null
          cash_at_end_of_period_orig?: number | null
          cash_at_end_of_period_usd?: number | null
          change_in_working_capital_eur?: number | null
          change_in_working_capital_orig?: number | null
          change_in_working_capital_usd?: number | null
          cik?: string | null
          common_dividends_paid_eur?: number | null
          common_dividends_paid_orig?: number | null
          common_dividends_paid_usd?: number | null
          common_stock_issuance_eur?: number | null
          common_stock_issuance_orig?: number | null
          common_stock_issuance_usd?: number | null
          common_stock_repurchased_eur?: number | null
          common_stock_repurchased_orig?: number | null
          common_stock_repurchased_usd?: number | null
          created_at?: string | null
          date?: string
          deferred_income_tax_eur?: number | null
          deferred_income_tax_orig?: number | null
          deferred_income_tax_usd?: number | null
          depreciation_and_amortization_eur?: number | null
          depreciation_and_amortization_orig?: number | null
          depreciation_and_amortization_usd?: number | null
          effect_of_forex_changes_on_cash_eur?: number | null
          effect_of_forex_changes_on_cash_orig?: number | null
          effect_of_forex_changes_on_cash_usd?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          free_cash_flow_eur?: number | null
          free_cash_flow_orig?: number | null
          free_cash_flow_usd?: number | null
          id?: string
          income_taxes_paid_eur?: number | null
          income_taxes_paid_orig?: number | null
          income_taxes_paid_usd?: number | null
          interest_paid_eur?: number | null
          interest_paid_orig?: number | null
          interest_paid_usd?: number | null
          inventory_eur?: number | null
          inventory_orig?: number | null
          inventory_usd?: number | null
          investments_in_property_plant_and_equipment_eur?: number | null
          investments_in_property_plant_and_equipment_orig?: number | null
          investments_in_property_plant_and_equipment_usd?: number | null
          long_term_net_debt_issuance_eur?: number | null
          long_term_net_debt_issuance_orig?: number | null
          long_term_net_debt_issuance_usd?: number | null
          net_cash_provided_by_financing_activities_eur?: number | null
          net_cash_provided_by_financing_activities_orig?: number | null
          net_cash_provided_by_financing_activities_usd?: number | null
          net_cash_provided_by_investing_activities_eur?: number | null
          net_cash_provided_by_investing_activities_orig?: number | null
          net_cash_provided_by_investing_activities_usd?: number | null
          net_cash_provided_by_operating_activities_eur?: number | null
          net_cash_provided_by_operating_activities_orig?: number | null
          net_cash_provided_by_operating_activities_usd?: number | null
          net_change_in_cash_eur?: number | null
          net_change_in_cash_orig?: number | null
          net_change_in_cash_usd?: number | null
          net_common_stock_issuance_eur?: number | null
          net_common_stock_issuance_orig?: number | null
          net_common_stock_issuance_usd?: number | null
          net_debt_issuance_eur?: number | null
          net_debt_issuance_orig?: number | null
          net_debt_issuance_usd?: number | null
          net_dividends_paid_eur?: number | null
          net_dividends_paid_orig?: number | null
          net_dividends_paid_usd?: number | null
          net_income_eur?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          net_preferred_stock_issuance_eur?: number | null
          net_preferred_stock_issuance_orig?: number | null
          net_preferred_stock_issuance_usd?: number | null
          net_stock_issuance_eur?: number | null
          net_stock_issuance_orig?: number | null
          net_stock_issuance_usd?: number | null
          operating_cash_flow_eur?: number | null
          operating_cash_flow_orig?: number | null
          operating_cash_flow_usd?: number | null
          other_financing_activities_eur?: number | null
          other_financing_activities_orig?: number | null
          other_financing_activities_usd?: number | null
          other_investing_activities_eur?: number | null
          other_investing_activities_orig?: number | null
          other_investing_activities_usd?: number | null
          other_non_cash_items_eur?: number | null
          other_non_cash_items_orig?: number | null
          other_non_cash_items_usd?: number | null
          other_working_capital_eur?: number | null
          other_working_capital_orig?: number | null
          other_working_capital_usd?: number | null
          period?: string
          preferred_dividends_paid_eur?: number | null
          preferred_dividends_paid_orig?: number | null
          preferred_dividends_paid_usd?: number | null
          purchases_of_investments_eur?: number | null
          purchases_of_investments_orig?: number | null
          purchases_of_investments_usd?: number | null
          reported_currency?: string
          sales_maturities_of_investments_eur?: number | null
          sales_maturities_of_investments_orig?: number | null
          sales_maturities_of_investments_usd?: number | null
          short_term_net_debt_issuance_eur?: number | null
          short_term_net_debt_issuance_orig?: number | null
          short_term_net_debt_issuance_usd?: number | null
          stock_based_compensation_eur?: number | null
          stock_based_compensation_orig?: number | null
          stock_based_compensation_usd?: number | null
          symbol?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_profiles: {
        Row: {
          beta: number | null
          ceo: string | null
          company_name: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          current_price: number | null
          cusip: string | null
          description: string | null
          exchange: string | null
          float_shares: number | null
          full_time_employees: number | null
          id: string
          industry: string | null
          ipo_date: string | null
          isin: string | null
          last_updated: string | null
          market_cap: number | null
          raw_profile_data: Json | null
          sector: string | null
          shares_outstanding: number | null
          symbol: string
          website: string | null
        }
        Insert: {
          beta?: number | null
          ceo?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          cusip?: string | null
          description?: string | null
          exchange?: string | null
          float_shares?: number | null
          full_time_employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          raw_profile_data?: Json | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol: string
          website?: string | null
        }
        Update: {
          beta?: number | null
          ceo?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          current_price?: number | null
          cusip?: string | null
          description?: string | null
          exchange?: string | null
          float_shares?: number | null
          full_time_employees?: number | null
          id?: string
          industry?: string | null
          ipo_date?: string | null
          isin?: string | null
          last_updated?: string | null
          market_cap?: number | null
          raw_profile_data?: Json | null
          sector?: string | null
          shares_outstanding?: number | null
          symbol?: string
          website?: string | null
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          base_currency: string
          created_at: string | null
          fetched_at: string
          id: string
          is_fallback: boolean | null
          rate: number
          target_currency: string
          updated_at: string | null
          valid_date: string
        }
        Insert: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string
          id?: string
          is_fallback?: boolean | null
          rate: number
          target_currency: string
          updated_at?: string | null
          valid_date?: string
        }
        Update: {
          base_currency?: string
          created_at?: string | null
          fetched_at?: string
          id?: string
          is_fallback?: boolean | null
          rate?: number
          target_currency?: string
          updated_at?: string | null
          valid_date?: string
        }
        Relationships: []
      }
      financial_data_quarterly: {
        Row: {
          accepted_date: string | null
          accounts_payable: number | null
          accounts_payables_change: number | null
          accounts_receivable: number | null
          accounts_receivables_change: number | null
          accumulated_other_comprehensive_income_loss: number | null
          acquisitions_net: number | null
          asset_turnover: number | null
          average_inventory: number | null
          average_payables: number | null
          average_receivables: number | null
          book_value_per_share: number | null
          bottom_line_net_income: number | null
          calendar_year: number
          capex: number | null
          capex_per_share: number | null
          capex_to_depreciation: number | null
          capex_to_operating_cash_flow: number | null
          capex_to_operating_income: number | null
          capex_to_revenue: number | null
          capital_expenditure_coverage_ratio: number | null
          capital_lease_obligations: number | null
          cash_and_equivalents: number | null
          cash_conversion_cycle: number | null
          cash_flow_to_debt_ratio: number | null
          cash_per_share: number | null
          cash_per_share_ratio: number | null
          cash_ratio: number | null
          change_in_working_capital: number | null
          common_stock: number | null
          company_equity_multiplier: number | null
          cost_and_expenses: number | null
          cost_of_revenue: number | null
          created_at: string
          current_assets: number | null
          current_liabilities: number | null
          current_ratio: number | null
          data_quality_score: number | null
          data_source: string
          days_inventory_outstanding: number | null
          days_of_inventory_outstanding_ratio: number | null
          days_of_payables_outstanding_ratio: number | null
          days_of_sales_outstanding_ratio: number | null
          days_payables_outstanding: number | null
          days_sales_outstanding: number | null
          debt_repayment: number | null
          debt_to_assets: number | null
          debt_to_equity: number | null
          debt_to_market_cap: number | null
          deferred_income_tax: number | null
          deferred_revenue: number | null
          deferred_revenue_non_current: number | null
          deferred_tax_liabilities_non_current: number | null
          dividend_paid_and_capex_coverage_ratio: number | null
          dividend_payments_coverage_ratio: number | null
          dividend_per_share: number | null
          dividend_per_share_ratio: number | null
          dividend_yield: number | null
          earnings_yield: number | null
          ebit: number | null
          ebit_per_revenue: number | null
          ebitda: number | null
          ebitda_margin: number | null
          effect_of_forex_changes_on_cash: number | null
          effective_tax_rate: number | null
          enterprise_value: number | null
          eps: number | null
          eps_corrected: number | null
          eps_diluted: number | null
          eps_wo_nri: number | null
          ev_to_ebitda: number | null
          ev_to_operating_cash_flow: number | null
          ev_to_sales: number | null
          fcf_yield: number | null
          filing_date: string | null
          fiscal_date: string
          fiscal_year: string | null
          fixed_asset_turnover: number | null
          fmp_filing_date: string | null
          free_cash_flow: number | null
          free_cash_flow_operating_cash_flow_ratio: number | null
          free_cash_flow_per_share: number | null
          free_cash_flow_per_share_ratio: number | null
          fx_rate_to_usd: number | null
          general_and_administrative_expenses: number | null
          goodwill: number | null
          goodwill_impairment: number | null
          graham_net_net: number | null
          graham_number: number | null
          gross_profit: number | null
          gross_profit_margin: number | null
          id: string
          impairment_of_assets: number | null
          income_before_tax: number | null
          income_tax_expense: number | null
          intangible_assets: number | null
          intangibles_to_total_assets: number | null
          interest_coverage: number | null
          interest_debt_per_share: number | null
          interest_expense: number | null
          interest_income: number | null
          inventory: number | null
          inventory_change: number | null
          inventory_turnover: number | null
          invested_capital: number | null
          invested_capital_metric: number | null
          investments_in_property_plant_and_equipment: number | null
          is_ttm: boolean
          long_term_debt: number | null
          long_term_debt_to_capitalization: number | null
          long_term_investments: number | null
          market_cap: number | null
          minority_interest: number | null
          missing_fields: string[] | null
          net_cash_provided_by_operating_activities: number | null
          net_cash_used_for_investing_activities: number | null
          net_cash_used_provided_by_financing_activities: number | null
          net_change_in_cash: number | null
          net_current_asset_value: number | null
          net_debt: number | null
          net_debt_to_ebitda: number | null
          net_income: number | null
          net_income_before_adjustments: number | null
          net_income_deductions: number | null
          net_income_from_continuing_operations: number | null
          net_income_from_discontinued_operations: number | null
          net_income_per_share: number | null
          net_interest_income: number | null
          net_profit_margin: number | null
          net_profit_margin_ratio: number | null
          non_operating_income_excluding_interest: number | null
          nopat: number | null
          operating_cash_flow: number | null
          operating_cash_flow_per_share: number | null
          operating_cash_flow_sales_ratio: number | null
          operating_cycle: number | null
          operating_expenses: number | null
          operating_profit_margin: number | null
          other_adjustments_to_net_income: number | null
          other_current_assets: number | null
          other_current_liabilities: number | null
          other_expenses: number | null
          other_financing_activities: number | null
          other_investing_activities: number | null
          other_liabilities: number | null
          other_non_cash_items: number | null
          other_non_current_assets: number | null
          other_non_current_liabilities: number | null
          other_total_stockholders_equity: number | null
          other_working_capital_change: number | null
          payables_period: number | null
          payout_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          pe_ratio_corrected: number | null
          peg_ratio: number | null
          period: string
          pfcf_ratio: number | null
          preferred_stock: number | null
          pretax_profit_margin: number | null
          price_book_value_ratio: number | null
          price_earnings_ratio: number | null
          price_earnings_to_growth_ratio: number | null
          price_fair_value: number | null
          price_sales_ratio: number | null
          price_to_book_ratio: number | null
          price_to_free_cash_flows_ratio: number | null
          price_to_operating_cash_flows_ratio: number | null
          price_to_sales_ratio: number | null
          price_to_sales_ratio_ttm: number | null
          proceeds_from_issuance_of_common_stock: number | null
          proceeds_from_issuance_of_debt: number | null
          proceeds_from_repurchase_of_equity: number | null
          property_plant_equipment_net: number | null
          ps_ratio: number | null
          purchases_of_investments: number | null
          quick_ratio: number | null
          raw_data_balance: Json | null
          raw_data_cashflow: Json | null
          raw_data_income: Json | null
          raw_data_profile: Json | null
          raw_key_metrics: Json | null
          raw_ratios: Json | null
          receivables_period: number | null
          receivables_turnover: number | null
          reported_currency: string
          research_and_development_expenses: number | null
          research_and_development_to_revenue: number | null
          restructuring_charges: number | null
          retained_earnings: number | null
          return_on_assets: number | null
          return_on_capital_employed: number | null
          return_on_equity: number | null
          return_on_invested_capital: number | null
          revenue: number | null
          revenue_per_share: number | null
          sales_general_and_administrative_to_revenue: number | null
          sales_maturities_of_investments: number | null
          selling_and_marketing_expenses: number | null
          selling_general_and_administrative_expenses: number | null
          shareholders_equity_per_share: number | null
          short_term_coverage_ratios: number | null
          short_term_debt: number | null
          short_term_investments: number | null
          stock_based_compensation: number | null
          stock_based_compensation_to_revenue: number | null
          stock_price_close: number | null
          stock_price_date: string | null
          symbol: string
          tangible_asset_value: number | null
          tangible_book_value_per_share: number | null
          tax_assets: number | null
          tax_rate: number | null
          total_asset_turnover: number | null
          total_assets: number | null
          total_debt: number | null
          total_debt_to_capitalization: number | null
          total_equity: number | null
          total_liabilities: number | null
          total_non_current_assets: number | null
          total_non_current_liabilities: number | null
          total_stockholders_equity: number | null
          treasury_stock: number | null
          unusual_items: number | null
          updated_at: string
          wacc: number | null
          weighted_avg_shares_diluted: number | null
          working_capital: number | null
        }
        Insert: {
          accepted_date?: string | null
          accounts_payable?: number | null
          accounts_payables_change?: number | null
          accounts_receivable?: number | null
          accounts_receivables_change?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          acquisitions_net?: number | null
          asset_turnover?: number | null
          average_inventory?: number | null
          average_payables?: number | null
          average_receivables?: number | null
          book_value_per_share?: number | null
          bottom_line_net_income?: number | null
          calendar_year: number
          capex?: number | null
          capex_per_share?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_operating_income?: number | null
          capex_to_revenue?: number | null
          capital_expenditure_coverage_ratio?: number | null
          capital_lease_obligations?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_flow_to_debt_ratio?: number | null
          cash_per_share?: number | null
          cash_per_share_ratio?: number | null
          cash_ratio?: number | null
          change_in_working_capital?: number | null
          common_stock?: number | null
          company_equity_multiplier?: number | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_of_inventory_outstanding_ratio?: number | null
          days_of_payables_outstanding_ratio?: number | null
          days_of_sales_outstanding_ratio?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_repayment?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          debt_to_market_cap?: number | null
          deferred_income_tax?: number | null
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payments_coverage_ratio?: number | null
          dividend_per_share?: number | null
          dividend_per_share_ratio?: number | null
          dividend_yield?: number | null
          earnings_yield?: number | null
          ebit?: number | null
          ebit_per_revenue?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          effect_of_forex_changes_on_cash?: number | null
          effective_tax_rate?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_corrected?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fcf_yield?: number | null
          filing_date?: string | null
          fiscal_date: string
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          free_cash_flow_per_share_ratio?: number | null
          fx_rate_to_usd?: number | null
          general_and_administrative_expenses?: number | null
          goodwill?: number | null
          goodwill_impairment?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          intangible_assets?: number | null
          intangibles_to_total_assets?: number | null
          interest_coverage?: number | null
          interest_debt_per_share?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          inventory?: number | null
          inventory_change?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          invested_capital_metric?: number | null
          investments_in_property_plant_and_equipment?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          long_term_debt_to_capitalization?: number | null
          long_term_investments?: number | null
          market_cap?: number | null
          minority_interest?: number | null
          missing_fields?: string[] | null
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activities?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_current_asset_value?: number | null
          net_debt?: number | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_income_before_adjustments?: number | null
          net_income_deductions?: number | null
          net_income_from_continuing_operations?: number | null
          net_income_from_discontinued_operations?: number | null
          net_income_per_share?: number | null
          net_interest_income?: number | null
          net_profit_margin?: number | null
          net_profit_margin_ratio?: number | null
          non_operating_income_excluding_interest?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_cycle?: number | null
          operating_expenses?: number | null
          operating_profit_margin?: number | null
          other_adjustments_to_net_income?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_expenses?: number | null
          other_financing_activities?: number | null
          other_investing_activities?: number | null
          other_liabilities?: number | null
          other_non_cash_items?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          other_total_stockholders_equity?: number | null
          other_working_capital_change?: number | null
          payables_period?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pe_ratio_corrected?: number | null
          peg_ratio?: number | null
          period: string
          pfcf_ratio?: number | null
          preferred_stock?: number | null
          pretax_profit_margin?: number | null
          price_book_value_ratio?: number | null
          price_earnings_ratio?: number | null
          price_earnings_to_growth_ratio?: number | null
          price_fair_value?: number | null
          price_sales_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_free_cash_flows_ratio?: number | null
          price_to_operating_cash_flows_ratio?: number | null
          price_to_sales_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          proceeds_from_issuance_of_common_stock?: number | null
          proceeds_from_issuance_of_debt?: number | null
          proceeds_from_repurchase_of_equity?: number | null
          property_plant_equipment_net?: number | null
          ps_ratio?: number | null
          purchases_of_investments?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_period?: number | null
          receivables_turnover?: number | null
          reported_currency: string
          research_and_development_expenses?: number | null
          research_and_development_to_revenue?: number | null
          restructuring_charges?: number | null
          retained_earnings?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          revenue_per_share?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          sales_maturities_of_investments?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          shareholders_equity_per_share?: number | null
          short_term_coverage_ratios?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          stock_based_compensation?: number | null
          stock_based_compensation_to_revenue?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol: string
          tangible_asset_value?: number | null
          tangible_book_value_per_share?: number | null
          tax_assets?: number | null
          tax_rate?: number | null
          total_asset_turnover?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_debt_to_capitalization?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
          treasury_stock?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
          working_capital?: number | null
        }
        Update: {
          accepted_date?: string | null
          accounts_payable?: number | null
          accounts_payables_change?: number | null
          accounts_receivable?: number | null
          accounts_receivables_change?: number | null
          accumulated_other_comprehensive_income_loss?: number | null
          acquisitions_net?: number | null
          asset_turnover?: number | null
          average_inventory?: number | null
          average_payables?: number | null
          average_receivables?: number | null
          book_value_per_share?: number | null
          bottom_line_net_income?: number | null
          calendar_year?: number
          capex?: number | null
          capex_per_share?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_operating_income?: number | null
          capex_to_revenue?: number | null
          capital_expenditure_coverage_ratio?: number | null
          capital_lease_obligations?: number | null
          cash_and_equivalents?: number | null
          cash_conversion_cycle?: number | null
          cash_flow_to_debt_ratio?: number | null
          cash_per_share?: number | null
          cash_per_share_ratio?: number | null
          cash_ratio?: number | null
          change_in_working_capital?: number | null
          common_stock?: number | null
          company_equity_multiplier?: number | null
          cost_and_expenses?: number | null
          cost_of_revenue?: number | null
          created_at?: string
          current_assets?: number | null
          current_liabilities?: number | null
          current_ratio?: number | null
          data_quality_score?: number | null
          data_source?: string
          days_inventory_outstanding?: number | null
          days_of_inventory_outstanding_ratio?: number | null
          days_of_payables_outstanding_ratio?: number | null
          days_of_sales_outstanding_ratio?: number | null
          days_payables_outstanding?: number | null
          days_sales_outstanding?: number | null
          debt_repayment?: number | null
          debt_to_assets?: number | null
          debt_to_equity?: number | null
          debt_to_market_cap?: number | null
          deferred_income_tax?: number | null
          deferred_revenue?: number | null
          deferred_revenue_non_current?: number | null
          deferred_tax_liabilities_non_current?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payments_coverage_ratio?: number | null
          dividend_per_share?: number | null
          dividend_per_share_ratio?: number | null
          dividend_yield?: number | null
          earnings_yield?: number | null
          ebit?: number | null
          ebit_per_revenue?: number | null
          ebitda?: number | null
          ebitda_margin?: number | null
          effect_of_forex_changes_on_cash?: number | null
          effective_tax_rate?: number | null
          enterprise_value?: number | null
          eps?: number | null
          eps_corrected?: number | null
          eps_diluted?: number | null
          eps_wo_nri?: number | null
          ev_to_ebitda?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fcf_yield?: number | null
          filing_date?: string | null
          fiscal_date?: string
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          fmp_filing_date?: string | null
          free_cash_flow?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          free_cash_flow_per_share_ratio?: number | null
          fx_rate_to_usd?: number | null
          general_and_administrative_expenses?: number | null
          goodwill?: number | null
          goodwill_impairment?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          gross_profit?: number | null
          gross_profit_margin?: number | null
          id?: string
          impairment_of_assets?: number | null
          income_before_tax?: number | null
          income_tax_expense?: number | null
          intangible_assets?: number | null
          intangibles_to_total_assets?: number | null
          interest_coverage?: number | null
          interest_debt_per_share?: number | null
          interest_expense?: number | null
          interest_income?: number | null
          inventory?: number | null
          inventory_change?: number | null
          inventory_turnover?: number | null
          invested_capital?: number | null
          invested_capital_metric?: number | null
          investments_in_property_plant_and_equipment?: number | null
          is_ttm?: boolean
          long_term_debt?: number | null
          long_term_debt_to_capitalization?: number | null
          long_term_investments?: number | null
          market_cap?: number | null
          minority_interest?: number | null
          missing_fields?: string[] | null
          net_cash_provided_by_operating_activities?: number | null
          net_cash_used_for_investing_activities?: number | null
          net_cash_used_provided_by_financing_activities?: number | null
          net_change_in_cash?: number | null
          net_current_asset_value?: number | null
          net_debt?: number | null
          net_debt_to_ebitda?: number | null
          net_income?: number | null
          net_income_before_adjustments?: number | null
          net_income_deductions?: number | null
          net_income_from_continuing_operations?: number | null
          net_income_from_discontinued_operations?: number | null
          net_income_per_share?: number | null
          net_interest_income?: number | null
          net_profit_margin?: number | null
          net_profit_margin_ratio?: number | null
          non_operating_income_excluding_interest?: number | null
          nopat?: number | null
          operating_cash_flow?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_cycle?: number | null
          operating_expenses?: number | null
          operating_profit_margin?: number | null
          other_adjustments_to_net_income?: number | null
          other_current_assets?: number | null
          other_current_liabilities?: number | null
          other_expenses?: number | null
          other_financing_activities?: number | null
          other_investing_activities?: number | null
          other_liabilities?: number | null
          other_non_cash_items?: number | null
          other_non_current_assets?: number | null
          other_non_current_liabilities?: number | null
          other_total_stockholders_equity?: number | null
          other_working_capital_change?: number | null
          payables_period?: number | null
          payout_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pe_ratio_corrected?: number | null
          peg_ratio?: number | null
          period?: string
          pfcf_ratio?: number | null
          preferred_stock?: number | null
          pretax_profit_margin?: number | null
          price_book_value_ratio?: number | null
          price_earnings_ratio?: number | null
          price_earnings_to_growth_ratio?: number | null
          price_fair_value?: number | null
          price_sales_ratio?: number | null
          price_to_book_ratio?: number | null
          price_to_free_cash_flows_ratio?: number | null
          price_to_operating_cash_flows_ratio?: number | null
          price_to_sales_ratio?: number | null
          price_to_sales_ratio_ttm?: number | null
          proceeds_from_issuance_of_common_stock?: number | null
          proceeds_from_issuance_of_debt?: number | null
          proceeds_from_repurchase_of_equity?: number | null
          property_plant_equipment_net?: number | null
          ps_ratio?: number | null
          purchases_of_investments?: number | null
          quick_ratio?: number | null
          raw_data_balance?: Json | null
          raw_data_cashflow?: Json | null
          raw_data_income?: Json | null
          raw_data_profile?: Json | null
          raw_key_metrics?: Json | null
          raw_ratios?: Json | null
          receivables_period?: number | null
          receivables_turnover?: number | null
          reported_currency?: string
          research_and_development_expenses?: number | null
          research_and_development_to_revenue?: number | null
          restructuring_charges?: number | null
          retained_earnings?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          revenue?: number | null
          revenue_per_share?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          sales_maturities_of_investments?: number | null
          selling_and_marketing_expenses?: number | null
          selling_general_and_administrative_expenses?: number | null
          shareholders_equity_per_share?: number | null
          short_term_coverage_ratios?: number | null
          short_term_debt?: number | null
          short_term_investments?: number | null
          stock_based_compensation?: number | null
          stock_based_compensation_to_revenue?: number | null
          stock_price_close?: number | null
          stock_price_date?: string | null
          symbol?: string
          tangible_asset_value?: number | null
          tangible_book_value_per_share?: number | null
          tax_assets?: number | null
          tax_rate?: number | null
          total_asset_turnover?: number | null
          total_assets?: number | null
          total_debt?: number | null
          total_debt_to_capitalization?: number | null
          total_equity?: number | null
          total_liabilities?: number | null
          total_non_current_assets?: number | null
          total_non_current_liabilities?: number | null
          total_stockholders_equity?: number | null
          treasury_stock?: number | null
          unusual_items?: number | null
          updated_at?: string
          wacc?: number | null
          weighted_avg_shares_diluted?: number | null
          working_capital?: number | null
        }
        Relationships: []
      }
      financial_ratios: {
        Row: {
          asset_turnover: number | null
          book_value_per_share: number | null
          bottom_line_profit_margin: number | null
          capex_per_share: number | null
          capital_expenditure_coverage_ratio: number | null
          cash_per_share: number | null
          cash_ratio: number | null
          continuous_operations_profit_margin: number | null
          created_at: string | null
          current_ratio: number | null
          date: string
          debt_service_coverage_ratio: number | null
          debt_to_assets_ratio: number | null
          debt_to_capital_ratio: number | null
          debt_to_equity_ratio: number | null
          debt_to_market_cap: number | null
          dividend_paid_and_capex_coverage_ratio: number | null
          dividend_payout_ratio: number | null
          dividend_per_share: number | null
          dividend_yield: number | null
          dividend_yield_percentage: number | null
          ebit_margin: number | null
          ebitda_margin: number | null
          ebt_per_ebit: number | null
          effective_tax_rate: number | null
          enterprise_value_multiple: number | null
          financial_leverage_ratio: number | null
          fiscal_year: string | null
          fixed_asset_turnover: number | null
          forward_price_to_earnings_growth_ratio: number | null
          free_cash_flow_operating_cash_flow_ratio: number | null
          free_cash_flow_per_share: number | null
          gross_profit_margin: number | null
          id: string
          interest_coverage_ratio: number | null
          interest_debt_per_share: number | null
          inventory_turnover: number | null
          long_term_debt_to_capital_ratio: number | null
          net_income_per_ebt: number | null
          net_income_per_share: number | null
          net_profit_margin: number | null
          operating_cash_flow_coverage_ratio: number | null
          operating_cash_flow_per_share: number | null
          operating_cash_flow_ratio: number | null
          operating_cash_flow_sales_ratio: number | null
          operating_profit_margin: number | null
          payables_turnover: number | null
          period: string
          pretax_profit_margin: number | null
          price_to_book_ratio: number | null
          price_to_earnings_growth_ratio: number | null
          price_to_earnings_ratio: number | null
          price_to_fair_value: number | null
          price_to_free_cash_flow_ratio: number | null
          price_to_operating_cash_flow_ratio: number | null
          price_to_sales_ratio: number | null
          quick_ratio: number | null
          receivables_turnover: number | null
          reported_currency: string
          revenue_per_share: number | null
          shareholders_equity_per_share: number | null
          short_term_operating_cash_flow_coverage_ratio: number | null
          solvency_ratio: number | null
          symbol: string
          tangible_book_value_per_share: number | null
          updated_at: string | null
          working_capital_turnover_ratio: number | null
        }
        Insert: {
          asset_turnover?: number | null
          book_value_per_share?: number | null
          bottom_line_profit_margin?: number | null
          capex_per_share?: number | null
          capital_expenditure_coverage_ratio?: number | null
          cash_per_share?: number | null
          cash_ratio?: number | null
          continuous_operations_profit_margin?: number | null
          created_at?: string | null
          current_ratio?: number | null
          date: string
          debt_service_coverage_ratio?: number | null
          debt_to_assets_ratio?: number | null
          debt_to_capital_ratio?: number | null
          debt_to_equity_ratio?: number | null
          debt_to_market_cap?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payout_ratio?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          dividend_yield_percentage?: number | null
          ebit_margin?: number | null
          ebitda_margin?: number | null
          ebt_per_ebit?: number | null
          effective_tax_rate?: number | null
          enterprise_value_multiple?: number | null
          financial_leverage_ratio?: number | null
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          forward_price_to_earnings_growth_ratio?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          gross_profit_margin?: number | null
          id?: string
          interest_coverage_ratio?: number | null
          interest_debt_per_share?: number | null
          inventory_turnover?: number | null
          long_term_debt_to_capital_ratio?: number | null
          net_income_per_ebt?: number | null
          net_income_per_share?: number | null
          net_profit_margin?: number | null
          operating_cash_flow_coverage_ratio?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_ratio?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_profit_margin?: number | null
          payables_turnover?: number | null
          period: string
          pretax_profit_margin?: number | null
          price_to_book_ratio?: number | null
          price_to_earnings_growth_ratio?: number | null
          price_to_earnings_ratio?: number | null
          price_to_fair_value?: number | null
          price_to_free_cash_flow_ratio?: number | null
          price_to_operating_cash_flow_ratio?: number | null
          price_to_sales_ratio?: number | null
          quick_ratio?: number | null
          receivables_turnover?: number | null
          reported_currency: string
          revenue_per_share?: number | null
          shareholders_equity_per_share?: number | null
          short_term_operating_cash_flow_coverage_ratio?: number | null
          solvency_ratio?: number | null
          symbol: string
          tangible_book_value_per_share?: number | null
          updated_at?: string | null
          working_capital_turnover_ratio?: number | null
        }
        Update: {
          asset_turnover?: number | null
          book_value_per_share?: number | null
          bottom_line_profit_margin?: number | null
          capex_per_share?: number | null
          capital_expenditure_coverage_ratio?: number | null
          cash_per_share?: number | null
          cash_ratio?: number | null
          continuous_operations_profit_margin?: number | null
          created_at?: string | null
          current_ratio?: number | null
          date?: string
          debt_service_coverage_ratio?: number | null
          debt_to_assets_ratio?: number | null
          debt_to_capital_ratio?: number | null
          debt_to_equity_ratio?: number | null
          debt_to_market_cap?: number | null
          dividend_paid_and_capex_coverage_ratio?: number | null
          dividend_payout_ratio?: number | null
          dividend_per_share?: number | null
          dividend_yield?: number | null
          dividend_yield_percentage?: number | null
          ebit_margin?: number | null
          ebitda_margin?: number | null
          ebt_per_ebit?: number | null
          effective_tax_rate?: number | null
          enterprise_value_multiple?: number | null
          financial_leverage_ratio?: number | null
          fiscal_year?: string | null
          fixed_asset_turnover?: number | null
          forward_price_to_earnings_growth_ratio?: number | null
          free_cash_flow_operating_cash_flow_ratio?: number | null
          free_cash_flow_per_share?: number | null
          gross_profit_margin?: number | null
          id?: string
          interest_coverage_ratio?: number | null
          interest_debt_per_share?: number | null
          inventory_turnover?: number | null
          long_term_debt_to_capital_ratio?: number | null
          net_income_per_ebt?: number | null
          net_income_per_share?: number | null
          net_profit_margin?: number | null
          operating_cash_flow_coverage_ratio?: number | null
          operating_cash_flow_per_share?: number | null
          operating_cash_flow_ratio?: number | null
          operating_cash_flow_sales_ratio?: number | null
          operating_profit_margin?: number | null
          payables_turnover?: number | null
          period?: string
          pretax_profit_margin?: number | null
          price_to_book_ratio?: number | null
          price_to_earnings_growth_ratio?: number | null
          price_to_earnings_ratio?: number | null
          price_to_fair_value?: number | null
          price_to_free_cash_flow_ratio?: number | null
          price_to_operating_cash_flow_ratio?: number | null
          price_to_sales_ratio?: number | null
          quick_ratio?: number | null
          receivables_turnover?: number | null
          reported_currency?: string
          revenue_per_share?: number | null
          shareholders_equity_per_share?: number | null
          short_term_operating_cash_flow_coverage_ratio?: number | null
          solvency_ratio?: number | null
          symbol?: string
          tangible_book_value_per_share?: number | null
          updated_at?: string | null
          working_capital_turnover_ratio?: number | null
        }
        Relationships: []
      }
      income_statements: {
        Row: {
          accepted_date: string | null
          bottom_line_net_income_eur: number | null
          bottom_line_net_income_orig: number | null
          bottom_line_net_income_usd: number | null
          cik: string | null
          cost_and_expenses_eur: number | null
          cost_and_expenses_orig: number | null
          cost_and_expenses_usd: number | null
          cost_of_revenue_eur: number | null
          cost_of_revenue_orig: number | null
          cost_of_revenue_usd: number | null
          created_at: string | null
          date: string
          depreciation_and_amortization_eur: number | null
          depreciation_and_amortization_orig: number | null
          depreciation_and_amortization_usd: number | null
          ebit_eur: number | null
          ebit_orig: number | null
          ebit_usd: number | null
          ebitda_eur: number | null
          ebitda_orig: number | null
          ebitda_usd: number | null
          eps: number | null
          eps_diluted: number | null
          filing_date: string | null
          fiscal_year: string | null
          general_and_administrative_expenses_eur: number | null
          general_and_administrative_expenses_orig: number | null
          general_and_administrative_expenses_usd: number | null
          gross_profit_eur: number | null
          gross_profit_orig: number | null
          gross_profit_usd: number | null
          id: string
          income_before_tax_eur: number | null
          income_before_tax_orig: number | null
          income_before_tax_usd: number | null
          income_tax_expense_eur: number | null
          income_tax_expense_orig: number | null
          income_tax_expense_usd: number | null
          interest_expense_eur: number | null
          interest_expense_orig: number | null
          interest_expense_usd: number | null
          interest_income_eur: number | null
          interest_income_orig: number | null
          interest_income_usd: number | null
          net_income_deductions_eur: number | null
          net_income_deductions_orig: number | null
          net_income_deductions_usd: number | null
          net_income_eur: number | null
          net_income_from_continuing_operations_eur: number | null
          net_income_from_continuing_operations_orig: number | null
          net_income_from_continuing_operations_usd: number | null
          net_income_from_discontinued_operations_eur: number | null
          net_income_from_discontinued_operations_orig: number | null
          net_income_from_discontinued_operations_usd: number | null
          net_income_orig: number | null
          net_income_usd: number | null
          net_interest_income_eur: number | null
          net_interest_income_orig: number | null
          net_interest_income_usd: number | null
          non_operating_income_excluding_interest_eur: number | null
          non_operating_income_excluding_interest_orig: number | null
          non_operating_income_excluding_interest_usd: number | null
          operating_expenses_eur: number | null
          operating_expenses_orig: number | null
          operating_expenses_usd: number | null
          operating_income_eur: number | null
          operating_income_orig: number | null
          operating_income_usd: number | null
          other_adjustments_to_net_income_eur: number | null
          other_adjustments_to_net_income_orig: number | null
          other_adjustments_to_net_income_usd: number | null
          other_expenses_eur: number | null
          other_expenses_orig: number | null
          other_expenses_usd: number | null
          period: string
          reported_currency: string
          research_and_development_expenses_eur: number | null
          research_and_development_expenses_orig: number | null
          research_and_development_expenses_usd: number | null
          revenue_eur: number | null
          revenue_orig: number | null
          revenue_usd: number | null
          selling_and_marketing_expenses_eur: number | null
          selling_and_marketing_expenses_orig: number | null
          selling_and_marketing_expenses_usd: number | null
          selling_general_and_administrative_expenses_eur: number | null
          selling_general_and_administrative_expenses_orig: number | null
          selling_general_and_administrative_expenses_usd: number | null
          symbol: string
          total_other_income_expenses_net_eur: number | null
          total_other_income_expenses_net_orig: number | null
          total_other_income_expenses_net_usd: number | null
          updated_at: string | null
          weighted_average_shs_out: number | null
          weighted_average_shs_out_dil: number | null
        }
        Insert: {
          accepted_date?: string | null
          bottom_line_net_income_eur?: number | null
          bottom_line_net_income_orig?: number | null
          bottom_line_net_income_usd?: number | null
          cik?: string | null
          cost_and_expenses_eur?: number | null
          cost_and_expenses_orig?: number | null
          cost_and_expenses_usd?: number | null
          cost_of_revenue_eur?: number | null
          cost_of_revenue_orig?: number | null
          cost_of_revenue_usd?: number | null
          created_at?: string | null
          date: string
          depreciation_and_amortization_eur?: number | null
          depreciation_and_amortization_orig?: number | null
          depreciation_and_amortization_usd?: number | null
          ebit_eur?: number | null
          ebit_orig?: number | null
          ebit_usd?: number | null
          ebitda_eur?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps?: number | null
          eps_diluted?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          general_and_administrative_expenses_eur?: number | null
          general_and_administrative_expenses_orig?: number | null
          general_and_administrative_expenses_usd?: number | null
          gross_profit_eur?: number | null
          gross_profit_orig?: number | null
          gross_profit_usd?: number | null
          id?: string
          income_before_tax_eur?: number | null
          income_before_tax_orig?: number | null
          income_before_tax_usd?: number | null
          income_tax_expense_eur?: number | null
          income_tax_expense_orig?: number | null
          income_tax_expense_usd?: number | null
          interest_expense_eur?: number | null
          interest_expense_orig?: number | null
          interest_expense_usd?: number | null
          interest_income_eur?: number | null
          interest_income_orig?: number | null
          interest_income_usd?: number | null
          net_income_deductions_eur?: number | null
          net_income_deductions_orig?: number | null
          net_income_deductions_usd?: number | null
          net_income_eur?: number | null
          net_income_from_continuing_operations_eur?: number | null
          net_income_from_continuing_operations_orig?: number | null
          net_income_from_continuing_operations_usd?: number | null
          net_income_from_discontinued_operations_eur?: number | null
          net_income_from_discontinued_operations_orig?: number | null
          net_income_from_discontinued_operations_usd?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          net_interest_income_eur?: number | null
          net_interest_income_orig?: number | null
          net_interest_income_usd?: number | null
          non_operating_income_excluding_interest_eur?: number | null
          non_operating_income_excluding_interest_orig?: number | null
          non_operating_income_excluding_interest_usd?: number | null
          operating_expenses_eur?: number | null
          operating_expenses_orig?: number | null
          operating_expenses_usd?: number | null
          operating_income_eur?: number | null
          operating_income_orig?: number | null
          operating_income_usd?: number | null
          other_adjustments_to_net_income_eur?: number | null
          other_adjustments_to_net_income_orig?: number | null
          other_adjustments_to_net_income_usd?: number | null
          other_expenses_eur?: number | null
          other_expenses_orig?: number | null
          other_expenses_usd?: number | null
          period: string
          reported_currency: string
          research_and_development_expenses_eur?: number | null
          research_and_development_expenses_orig?: number | null
          research_and_development_expenses_usd?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_usd?: number | null
          selling_and_marketing_expenses_eur?: number | null
          selling_and_marketing_expenses_orig?: number | null
          selling_and_marketing_expenses_usd?: number | null
          selling_general_and_administrative_expenses_eur?: number | null
          selling_general_and_administrative_expenses_orig?: number | null
          selling_general_and_administrative_expenses_usd?: number | null
          symbol: string
          total_other_income_expenses_net_eur?: number | null
          total_other_income_expenses_net_orig?: number | null
          total_other_income_expenses_net_usd?: number | null
          updated_at?: string | null
          weighted_average_shs_out?: number | null
          weighted_average_shs_out_dil?: number | null
        }
        Update: {
          accepted_date?: string | null
          bottom_line_net_income_eur?: number | null
          bottom_line_net_income_orig?: number | null
          bottom_line_net_income_usd?: number | null
          cik?: string | null
          cost_and_expenses_eur?: number | null
          cost_and_expenses_orig?: number | null
          cost_and_expenses_usd?: number | null
          cost_of_revenue_eur?: number | null
          cost_of_revenue_orig?: number | null
          cost_of_revenue_usd?: number | null
          created_at?: string | null
          date?: string
          depreciation_and_amortization_eur?: number | null
          depreciation_and_amortization_orig?: number | null
          depreciation_and_amortization_usd?: number | null
          ebit_eur?: number | null
          ebit_orig?: number | null
          ebit_usd?: number | null
          ebitda_eur?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps?: number | null
          eps_diluted?: number | null
          filing_date?: string | null
          fiscal_year?: string | null
          general_and_administrative_expenses_eur?: number | null
          general_and_administrative_expenses_orig?: number | null
          general_and_administrative_expenses_usd?: number | null
          gross_profit_eur?: number | null
          gross_profit_orig?: number | null
          gross_profit_usd?: number | null
          id?: string
          income_before_tax_eur?: number | null
          income_before_tax_orig?: number | null
          income_before_tax_usd?: number | null
          income_tax_expense_eur?: number | null
          income_tax_expense_orig?: number | null
          income_tax_expense_usd?: number | null
          interest_expense_eur?: number | null
          interest_expense_orig?: number | null
          interest_expense_usd?: number | null
          interest_income_eur?: number | null
          interest_income_orig?: number | null
          interest_income_usd?: number | null
          net_income_deductions_eur?: number | null
          net_income_deductions_orig?: number | null
          net_income_deductions_usd?: number | null
          net_income_eur?: number | null
          net_income_from_continuing_operations_eur?: number | null
          net_income_from_continuing_operations_orig?: number | null
          net_income_from_continuing_operations_usd?: number | null
          net_income_from_discontinued_operations_eur?: number | null
          net_income_from_discontinued_operations_orig?: number | null
          net_income_from_discontinued_operations_usd?: number | null
          net_income_orig?: number | null
          net_income_usd?: number | null
          net_interest_income_eur?: number | null
          net_interest_income_orig?: number | null
          net_interest_income_usd?: number | null
          non_operating_income_excluding_interest_eur?: number | null
          non_operating_income_excluding_interest_orig?: number | null
          non_operating_income_excluding_interest_usd?: number | null
          operating_expenses_eur?: number | null
          operating_expenses_orig?: number | null
          operating_expenses_usd?: number | null
          operating_income_eur?: number | null
          operating_income_orig?: number | null
          operating_income_usd?: number | null
          other_adjustments_to_net_income_eur?: number | null
          other_adjustments_to_net_income_orig?: number | null
          other_adjustments_to_net_income_usd?: number | null
          other_expenses_eur?: number | null
          other_expenses_orig?: number | null
          other_expenses_usd?: number | null
          period?: string
          reported_currency?: string
          research_and_development_expenses_eur?: number | null
          research_and_development_expenses_orig?: number | null
          research_and_development_expenses_usd?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_usd?: number | null
          selling_and_marketing_expenses_eur?: number | null
          selling_and_marketing_expenses_orig?: number | null
          selling_and_marketing_expenses_usd?: number | null
          selling_general_and_administrative_expenses_eur?: number | null
          selling_general_and_administrative_expenses_orig?: number | null
          selling_general_and_administrative_expenses_usd?: number | null
          symbol?: string
          total_other_income_expenses_net_eur?: number | null
          total_other_income_expenses_net_orig?: number | null
          total_other_income_expenses_net_usd?: number | null
          updated_at?: string | null
          weighted_average_shs_out?: number | null
          weighted_average_shs_out_dil?: number | null
        }
        Relationships: []
      }
      industry_averages: {
        Row: {
          calculation_date: string
          id: number
          industry: string
          metric_type: string
          value: number | null
        }
        Insert: {
          calculation_date: string
          id?: number
          industry: string
          metric_type: string
          value?: number | null
        }
        Update: {
          calculation_date?: string
          id?: number
          industry?: string
          metric_type?: string
          value?: number | null
        }
        Relationships: []
      }
      industry_metrics: {
        Row: {
          created_at: string
          date: string
          exchange: string | null
          id: string
          industry: string
          pe_ratio: number | null
        }
        Insert: {
          created_at?: string
          date: string
          exchange?: string | null
          id?: string
          industry: string
          pe_ratio?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          exchange?: string | null
          id?: string
          industry?: string
          pe_ratio?: number | null
        }
        Relationships: []
      }
      key_metrics: {
        Row: {
          average_inventory_eur: number | null
          average_inventory_orig: number | null
          average_inventory_usd: number | null
          average_payables_eur: number | null
          average_payables_orig: number | null
          average_payables_usd: number | null
          average_receivables_eur: number | null
          average_receivables_orig: number | null
          average_receivables_usd: number | null
          capex_to_depreciation: number | null
          capex_to_operating_cash_flow: number | null
          capex_to_revenue: number | null
          cash_conversion_cycle: number | null
          created_at: string | null
          current_ratio: number | null
          date: string
          days_of_inventory_outstanding: number | null
          days_of_payables_outstanding: number | null
          days_of_sales_outstanding: number | null
          earnings_yield: number | null
          enterprise_value_eur: number | null
          enterprise_value_orig: number | null
          enterprise_value_usd: number | null
          ev_to_ebitda: number | null
          ev_to_free_cash_flow: number | null
          ev_to_operating_cash_flow: number | null
          ev_to_sales: number | null
          fiscal_year: string | null
          free_cash_flow_to_equity_eur: number | null
          free_cash_flow_to_equity_orig: number | null
          free_cash_flow_to_equity_usd: number | null
          free_cash_flow_to_firm_eur: number | null
          free_cash_flow_to_firm_orig: number | null
          free_cash_flow_to_firm_usd: number | null
          free_cash_flow_yield: number | null
          graham_net_net: number | null
          graham_number: number | null
          id: string
          income_quality: number | null
          intangibles_to_total_assets: number | null
          interest_burden: number | null
          invested_capital_eur: number | null
          invested_capital_orig: number | null
          invested_capital_usd: number | null
          market_cap_eur: number | null
          market_cap_orig: number | null
          market_cap_usd: number | null
          net_current_asset_value_eur: number | null
          net_current_asset_value_orig: number | null
          net_current_asset_value_usd: number | null
          net_debt_to_ebitda: number | null
          operating_cycle: number | null
          operating_return_on_assets: number | null
          period: string
          reported_currency: string
          research_and_developement_to_revenue: number | null
          return_on_assets: number | null
          return_on_capital_employed: number | null
          return_on_equity: number | null
          return_on_invested_capital: number | null
          return_on_tangible_assets: number | null
          sales_general_and_administrative_to_revenue: number | null
          stock_based_compensation_to_revenue: number | null
          symbol: string
          tangible_asset_value_eur: number | null
          tangible_asset_value_orig: number | null
          tangible_asset_value_usd: number | null
          tax_burden: number | null
          updated_at: string | null
          working_capital_eur: number | null
          working_capital_orig: number | null
          working_capital_usd: number | null
        }
        Insert: {
          average_inventory_eur?: number | null
          average_inventory_orig?: number | null
          average_inventory_usd?: number | null
          average_payables_eur?: number | null
          average_payables_orig?: number | null
          average_payables_usd?: number | null
          average_receivables_eur?: number | null
          average_receivables_orig?: number | null
          average_receivables_usd?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_revenue?: number | null
          cash_conversion_cycle?: number | null
          created_at?: string | null
          current_ratio?: number | null
          date: string
          days_of_inventory_outstanding?: number | null
          days_of_payables_outstanding?: number | null
          days_of_sales_outstanding?: number | null
          earnings_yield?: number | null
          enterprise_value_eur?: number | null
          enterprise_value_orig?: number | null
          enterprise_value_usd?: number | null
          ev_to_ebitda?: number | null
          ev_to_free_cash_flow?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fiscal_year?: string | null
          free_cash_flow_to_equity_eur?: number | null
          free_cash_flow_to_equity_orig?: number | null
          free_cash_flow_to_equity_usd?: number | null
          free_cash_flow_to_firm_eur?: number | null
          free_cash_flow_to_firm_orig?: number | null
          free_cash_flow_to_firm_usd?: number | null
          free_cash_flow_yield?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          id?: string
          income_quality?: number | null
          intangibles_to_total_assets?: number | null
          interest_burden?: number | null
          invested_capital_eur?: number | null
          invested_capital_orig?: number | null
          invested_capital_usd?: number | null
          market_cap_eur?: number | null
          market_cap_orig?: number | null
          market_cap_usd?: number | null
          net_current_asset_value_eur?: number | null
          net_current_asset_value_orig?: number | null
          net_current_asset_value_usd?: number | null
          net_debt_to_ebitda?: number | null
          operating_cycle?: number | null
          operating_return_on_assets?: number | null
          period: string
          reported_currency: string
          research_and_developement_to_revenue?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          return_on_tangible_assets?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          stock_based_compensation_to_revenue?: number | null
          symbol: string
          tangible_asset_value_eur?: number | null
          tangible_asset_value_orig?: number | null
          tangible_asset_value_usd?: number | null
          tax_burden?: number | null
          updated_at?: string | null
          working_capital_eur?: number | null
          working_capital_orig?: number | null
          working_capital_usd?: number | null
        }
        Update: {
          average_inventory_eur?: number | null
          average_inventory_orig?: number | null
          average_inventory_usd?: number | null
          average_payables_eur?: number | null
          average_payables_orig?: number | null
          average_payables_usd?: number | null
          average_receivables_eur?: number | null
          average_receivables_orig?: number | null
          average_receivables_usd?: number | null
          capex_to_depreciation?: number | null
          capex_to_operating_cash_flow?: number | null
          capex_to_revenue?: number | null
          cash_conversion_cycle?: number | null
          created_at?: string | null
          current_ratio?: number | null
          date?: string
          days_of_inventory_outstanding?: number | null
          days_of_payables_outstanding?: number | null
          days_of_sales_outstanding?: number | null
          earnings_yield?: number | null
          enterprise_value_eur?: number | null
          enterprise_value_orig?: number | null
          enterprise_value_usd?: number | null
          ev_to_ebitda?: number | null
          ev_to_free_cash_flow?: number | null
          ev_to_operating_cash_flow?: number | null
          ev_to_sales?: number | null
          fiscal_year?: string | null
          free_cash_flow_to_equity_eur?: number | null
          free_cash_flow_to_equity_orig?: number | null
          free_cash_flow_to_equity_usd?: number | null
          free_cash_flow_to_firm_eur?: number | null
          free_cash_flow_to_firm_orig?: number | null
          free_cash_flow_to_firm_usd?: number | null
          free_cash_flow_yield?: number | null
          graham_net_net?: number | null
          graham_number?: number | null
          id?: string
          income_quality?: number | null
          intangibles_to_total_assets?: number | null
          interest_burden?: number | null
          invested_capital_eur?: number | null
          invested_capital_orig?: number | null
          invested_capital_usd?: number | null
          market_cap_eur?: number | null
          market_cap_orig?: number | null
          market_cap_usd?: number | null
          net_current_asset_value_eur?: number | null
          net_current_asset_value_orig?: number | null
          net_current_asset_value_usd?: number | null
          net_debt_to_ebitda?: number | null
          operating_cycle?: number | null
          operating_return_on_assets?: number | null
          period?: string
          reported_currency?: string
          research_and_developement_to_revenue?: number | null
          return_on_assets?: number | null
          return_on_capital_employed?: number | null
          return_on_equity?: number | null
          return_on_invested_capital?: number | null
          return_on_tangible_assets?: number | null
          sales_general_and_administrative_to_revenue?: number | null
          stock_based_compensation_to_revenue?: number | null
          symbol?: string
          tangible_asset_value_eur?: number | null
          tangible_asset_value_orig?: number | null
          tangible_asset_value_usd?: number | null
          tax_burden?: number | null
          updated_at?: string | null
          working_capital_eur?: number | null
          working_capital_orig?: number | null
          working_capital_usd?: number | null
        }
        Relationships: []
      }
      market_risk_premiums: {
        Row: {
          country: string
          created_at: string
          id: string
          total_equity_risk_premium: number
          updated_at: string
          valid_date: string
        }
        Insert: {
          country: string
          created_at?: string
          id?: string
          total_equity_risk_premium: number
          updated_at?: string
          valid_date?: string
        }
        Update: {
          country?: string
          created_at?: string
          id?: string
          total_equity_risk_premium?: number
          updated_at?: string
          valid_date?: string
        }
        Relationships: []
      }
      precomputed_metrics: {
        Row: {
          bvps: number | null
          calculation_date: string
          cash_to_market_cap: number | null
          company_name: string | null
          created_at: string
          currency: string
          current_price_eur: number | null
          current_price_usd: number | null
          current_ratio: number | null
          debt_growth_3y_cagr: number | null
          debt_growth_5y_cagr: number | null
          debt_growth_qoq: number | null
          debt_growth_yoy: number | null
          debt_to_ebitda: number | null
          debt_to_equity: number | null
          debt_to_fcf: number | null
          ebit_growth_10y_cagr: number | null
          ebit_growth_3y_cagr: number | null
          ebit_growth_5y_cagr: number | null
          ebit_growth_qoq: number | null
          ebit_growth_yoy: number | null
          ebit_margin: number | null
          ebitda_eur: number | null
          ebitda_margin: number | null
          ebitda_orig: number | null
          ebitda_usd: number | null
          eps_diluted_eur: number | null
          eps_diluted_orig: number | null
          eps_diluted_usd: number | null
          eps_growth_3y_cagr: number | null
          eps_growth_5y_cagr: number | null
          eps_growth_qoq: number | null
          eps_growth_quarters: number | null
          eps_growth_years: number | null
          eps_growth_yoy: number | null
          fcf_growth_3y_cagr: number | null
          fcf_growth_5y_cagr: number | null
          fcf_growth_qoq: number | null
          fcf_growth_yoy: number | null
          fcf_margin: number | null
          fcf_per_share: number | null
          graham_number_eur: number | null
          graham_number_orig: number | null
          graham_number_usd: number | null
          gross_margin: number | null
          gross_profit_eur: number | null
          gross_profit_orig: number | null
          gross_profit_usd: number | null
          id: string
          interest_coverage: number | null
          net_cash_eur: number | null
          net_cash_growth_yoy: number | null
          net_cash_orig: number | null
          net_cash_usd: number | null
          net_income_eur: number | null
          net_income_growth_3y_cagr: number | null
          net_income_growth_5y_cagr: number | null
          net_income_growth_qoq: number | null
          net_income_growth_quarters: number | null
          net_income_growth_years: number | null
          net_income_growth_yoy: number | null
          net_income_orig: number | null
          net_income_profitable_10years: number | null
          net_income_profitable_20years: number | null
          net_income_usd: number | null
          operating_cash_flow_per_share: number | null
          operating_margin: number | null
          p_fcf_ratio: number | null
          p_ocf_ratio: number | null
          pb_ratio: number | null
          pe_ratio: number | null
          pretax_margin: number | null
          price_change_10y: number | null
          price_change_1d: number | null
          price_change_1m: number | null
          price_change_1y: number | null
          price_change_3m: number | null
          price_change_3y: number | null
          price_change_5d: number | null
          price_change_5y: number | null
          price_change_6m: number | null
          price_change_max: number | null
          price_change_ytd: number | null
          price_updated_at: string | null
          profit_margin: number | null
          profits_per_employee: number | null
          ps_ratio: number | null
          quick_ratio: number | null
          revenue_eur: number | null
          revenue_orig: number | null
          revenue_per_employee: number | null
          revenue_usd: number | null
          rnd_expenses_eur: number | null
          rnd_expenses_orig: number | null
          rnd_expenses_usd: number | null
          rnd_to_revenue_ratio: number | null
          roa: number | null
          roa_5y_avg: number | null
          roce: number | null
          roe: number | null
          roe_5y_avg: number | null
          roic: number | null
          roic_5y_avg: number | null
          stock_id: number
          symbol: string
          tax_to_revenue_ratio: number | null
          tbvps: number | null
          updated_at: string
          weighted_avg_shares_dil: number | null
          working_capital: number | null
          working_capital_turnover: number | null
        }
        Insert: {
          bvps?: number | null
          calculation_date?: string
          cash_to_market_cap?: number | null
          company_name?: string | null
          created_at?: string
          currency: string
          current_price_eur?: number | null
          current_price_usd?: number | null
          current_ratio?: number | null
          debt_growth_3y_cagr?: number | null
          debt_growth_5y_cagr?: number | null
          debt_growth_qoq?: number | null
          debt_growth_yoy?: number | null
          debt_to_ebitda?: number | null
          debt_to_equity?: number | null
          debt_to_fcf?: number | null
          ebit_growth_10y_cagr?: number | null
          ebit_growth_3y_cagr?: number | null
          ebit_growth_5y_cagr?: number | null
          ebit_growth_qoq?: number | null
          ebit_growth_yoy?: number | null
          ebit_margin?: number | null
          ebitda_eur?: number | null
          ebitda_margin?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps_diluted_eur?: number | null
          eps_diluted_orig?: number | null
          eps_diluted_usd?: number | null
          eps_growth_3y_cagr?: number | null
          eps_growth_5y_cagr?: number | null
          eps_growth_qoq?: number | null
          eps_growth_quarters?: number | null
          eps_growth_years?: number | null
          eps_growth_yoy?: number | null
          fcf_growth_3y_cagr?: number | null
          fcf_growth_5y_cagr?: number | null
          fcf_growth_qoq?: number | null
          fcf_growth_yoy?: number | null
          fcf_margin?: number | null
          fcf_per_share?: number | null
          graham_number_eur?: number | null
          graham_number_orig?: number | null
          graham_number_usd?: number | null
          gross_margin?: number | null
          gross_profit_eur?: number | null
          gross_profit_orig?: number | null
          gross_profit_usd?: number | null
          id?: string
          interest_coverage?: number | null
          net_cash_eur?: number | null
          net_cash_growth_yoy?: number | null
          net_cash_orig?: number | null
          net_cash_usd?: number | null
          net_income_eur?: number | null
          net_income_growth_3y_cagr?: number | null
          net_income_growth_5y_cagr?: number | null
          net_income_growth_qoq?: number | null
          net_income_growth_quarters?: number | null
          net_income_growth_years?: number | null
          net_income_growth_yoy?: number | null
          net_income_orig?: number | null
          net_income_profitable_10years?: number | null
          net_income_profitable_20years?: number | null
          net_income_usd?: number | null
          operating_cash_flow_per_share?: number | null
          operating_margin?: number | null
          p_fcf_ratio?: number | null
          p_ocf_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pretax_margin?: number | null
          price_change_10y?: number | null
          price_change_1d?: number | null
          price_change_1m?: number | null
          price_change_1y?: number | null
          price_change_3m?: number | null
          price_change_3y?: number | null
          price_change_5d?: number | null
          price_change_5y?: number | null
          price_change_6m?: number | null
          price_change_max?: number | null
          price_change_ytd?: number | null
          price_updated_at?: string | null
          profit_margin?: number | null
          profits_per_employee?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_per_employee?: number | null
          revenue_usd?: number | null
          rnd_expenses_eur?: number | null
          rnd_expenses_orig?: number | null
          rnd_expenses_usd?: number | null
          rnd_to_revenue_ratio?: number | null
          roa?: number | null
          roa_5y_avg?: number | null
          roce?: number | null
          roe?: number | null
          roe_5y_avg?: number | null
          roic?: number | null
          roic_5y_avg?: number | null
          stock_id: number
          symbol: string
          tax_to_revenue_ratio?: number | null
          tbvps?: number | null
          updated_at?: string
          weighted_avg_shares_dil?: number | null
          working_capital?: number | null
          working_capital_turnover?: number | null
        }
        Update: {
          bvps?: number | null
          calculation_date?: string
          cash_to_market_cap?: number | null
          company_name?: string | null
          created_at?: string
          currency?: string
          current_price_eur?: number | null
          current_price_usd?: number | null
          current_ratio?: number | null
          debt_growth_3y_cagr?: number | null
          debt_growth_5y_cagr?: number | null
          debt_growth_qoq?: number | null
          debt_growth_yoy?: number | null
          debt_to_ebitda?: number | null
          debt_to_equity?: number | null
          debt_to_fcf?: number | null
          ebit_growth_10y_cagr?: number | null
          ebit_growth_3y_cagr?: number | null
          ebit_growth_5y_cagr?: number | null
          ebit_growth_qoq?: number | null
          ebit_growth_yoy?: number | null
          ebit_margin?: number | null
          ebitda_eur?: number | null
          ebitda_margin?: number | null
          ebitda_orig?: number | null
          ebitda_usd?: number | null
          eps_diluted_eur?: number | null
          eps_diluted_orig?: number | null
          eps_diluted_usd?: number | null
          eps_growth_3y_cagr?: number | null
          eps_growth_5y_cagr?: number | null
          eps_growth_qoq?: number | null
          eps_growth_quarters?: number | null
          eps_growth_years?: number | null
          eps_growth_yoy?: number | null
          fcf_growth_3y_cagr?: number | null
          fcf_growth_5y_cagr?: number | null
          fcf_growth_qoq?: number | null
          fcf_growth_yoy?: number | null
          fcf_margin?: number | null
          fcf_per_share?: number | null
          graham_number_eur?: number | null
          graham_number_orig?: number | null
          graham_number_usd?: number | null
          gross_margin?: number | null
          gross_profit_eur?: number | null
          gross_profit_orig?: number | null
          gross_profit_usd?: number | null
          id?: string
          interest_coverage?: number | null
          net_cash_eur?: number | null
          net_cash_growth_yoy?: number | null
          net_cash_orig?: number | null
          net_cash_usd?: number | null
          net_income_eur?: number | null
          net_income_growth_3y_cagr?: number | null
          net_income_growth_5y_cagr?: number | null
          net_income_growth_qoq?: number | null
          net_income_growth_quarters?: number | null
          net_income_growth_years?: number | null
          net_income_growth_yoy?: number | null
          net_income_orig?: number | null
          net_income_profitable_10years?: number | null
          net_income_profitable_20years?: number | null
          net_income_usd?: number | null
          operating_cash_flow_per_share?: number | null
          operating_margin?: number | null
          p_fcf_ratio?: number | null
          p_ocf_ratio?: number | null
          pb_ratio?: number | null
          pe_ratio?: number | null
          pretax_margin?: number | null
          price_change_10y?: number | null
          price_change_1d?: number | null
          price_change_1m?: number | null
          price_change_1y?: number | null
          price_change_3m?: number | null
          price_change_3y?: number | null
          price_change_5d?: number | null
          price_change_5y?: number | null
          price_change_6m?: number | null
          price_change_max?: number | null
          price_change_ytd?: number | null
          price_updated_at?: string | null
          profit_margin?: number | null
          profits_per_employee?: number | null
          ps_ratio?: number | null
          quick_ratio?: number | null
          revenue_eur?: number | null
          revenue_orig?: number | null
          revenue_per_employee?: number | null
          revenue_usd?: number | null
          rnd_expenses_eur?: number | null
          rnd_expenses_orig?: number | null
          rnd_expenses_usd?: number | null
          rnd_to_revenue_ratio?: number | null
          roa?: number | null
          roa_5y_avg?: number | null
          roce?: number | null
          roe?: number | null
          roe_5y_avg?: number | null
          roic?: number | null
          roic_5y_avg?: number | null
          stock_id?: number
          symbol?: string
          tax_to_revenue_ratio?: number | null
          tbvps?: number | null
          updated_at?: string
          weighted_avg_shares_dil?: number | null
          working_capital?: number | null
          working_capital_turnover?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_free_rates: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          data_source: string
          id: string
          rate: number
          updated_at: string
          valid_date: string
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          data_source: string
          id?: string
          rate: number
          updated_at?: string
          valid_date: string
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          data_source?: string
          id?: string
          rate?: number
          updated_at?: string
          valid_date?: string
        }
        Relationships: []
      }
      scheduled_job_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_name: string
          markets_processed: Json | null
          started_at: string | null
          status: string | null
          stocks_failed: number | null
          stocks_full_analyzed: number | null
          stocks_price_updated: number | null
          stocks_skipped: number | null
          total_api_calls: number | null
          trigger_source: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_name: string
          markets_processed?: Json | null
          started_at?: string | null
          status?: string | null
          stocks_failed?: number | null
          stocks_full_analyzed?: number | null
          stocks_price_updated?: number | null
          stocks_skipped?: number | null
          total_api_calls?: number | null
          trigger_source?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_name?: string
          markets_processed?: Json | null
          started_at?: string | null
          status?: string | null
          stocks_failed?: number | null
          stocks_full_analyzed?: number | null
          stocks_price_updated?: number | null
          stocks_skipped?: number | null
          total_api_calls?: number | null
          trigger_source?: string | null
        }
        Relationships: []
      }
      stock_analysis_cache: {
        Row: {
          analysis_result: Json
          buffett_score: number | null
          created_at: string
          id: string
          last_updated: string
          market_id: string
          symbol: string
        }
        Insert: {
          analysis_result: Json
          buffett_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          market_id: string
          symbol: string
        }
        Update: {
          analysis_result?: Json
          buffett_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          market_id?: string
          symbol?: string
        }
        Relationships: []
      }
      stock_data_cache: {
        Row: {
          company_name: string | null
          created_at: string
          currency: string | null
          exchange: string | null
          id: string
          last_updated: string
          raw_data: Json
          sector: string | null
          symbol: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          last_updated?: string
          raw_data: Json
          sector?: string | null
          symbol: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          currency?: string | null
          exchange?: string | null
          id?: string
          last_updated?: string
          raw_data?: Json
          sector?: string | null
          symbol?: string
        }
        Relationships: []
      }
      stocks: {
        Row: {
          address: string | null
          ceo: string | null
          city: string | null
          country: string | null
          currency: string | null
          description: string | null
          exchange: string | null
          full_time_employees: number | null
          id: number
          image: string | null
          industry: string | null
          industry_de: string | null
          ipo_date: string | null
          is_actively_trading: boolean | null
          is_adr: boolean | null
          is_etf: boolean | null
          is_fund: boolean | null
          isin: string | null
          last_dividend: number | null
          last_updated: string | null
          market_cap: number | null
          name: string | null
          phone: string | null
          price: number | null
          sector: string | null
          sector_de: string | null
          state: string | null
          symbol: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          ceo?: string | null
          city?: string | null
          country?: string | null
          currency?: string | null
          description?: string | null
          exchange?: string | null
          full_time_employees?: number | null
          id?: number
          image?: string | null
          industry?: string | null
          industry_de?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string | null
          phone?: string | null
          price?: number | null
          sector?: string | null
          sector_de?: string | null
          state?: string | null
          symbol: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          ceo?: string | null
          city?: string | null
          country?: string | null
          currency?: string | null
          description?: string | null
          exchange?: string | null
          full_time_employees?: number | null
          id?: number
          image?: string | null
          industry?: string | null
          industry_de?: string | null
          ipo_date?: string | null
          is_actively_trading?: boolean | null
          is_adr?: boolean | null
          is_etf?: boolean | null
          is_fund?: boolean | null
          isin?: string | null
          last_dividend?: number | null
          last_updated?: string | null
          market_cap?: number | null
          name?: string | null
          phone?: string | null
          price?: number | null
          sector?: string | null
          sector_de?: string | null
          state?: string | null
          symbol?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_stocks: {
        Row: {
          analysis_data: Json | null
          buffett_score: number | null
          company_name: string | null
          created_at: string
          id: string
          last_analysis_date: string | null
          notes: string | null
          symbol: string
          updated_at: string
          user_id: string
          watchlist_id: string | null
        }
        Insert: {
          analysis_data?: Json | null
          buffett_score?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          last_analysis_date?: string | null
          notes?: string | null
          symbol: string
          updated_at?: string
          user_id: string
          watchlist_id?: string | null
        }
        Update: {
          analysis_data?: Json | null
          buffett_score?: number | null
          company_name?: string | null
          created_at?: string
          id?: string
          last_analysis_date?: string | null
          notes?: string | null
          symbol?: string
          updated_at?: string
          user_id?: string
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_stocks_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: "customer" | "admin" | "super_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["customer", "admin", "super_admin"],
    },
  },
} as const
